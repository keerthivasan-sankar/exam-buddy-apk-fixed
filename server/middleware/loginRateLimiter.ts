import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import NodeCache from 'node-cache';
import crypto from 'crypto';

// ============================================
// CONFIGURATION - Easy to modify without developer
// ============================================
const CONFIG = {
  MAX_FAILED_ATTEMPTS: 5,              // Lock after 5 failed attempts
  LOCKOUT_DURATION_HOURS: 5,           // Lock for 5 hours (auto-unlock)
  LOCKOUT_DURATION_SECONDS: 5 * 60 * 60, // 18,000 seconds
  RATE_LIMIT_WINDOW: 60,               // 1 minute
  RATE_LIMIT_MAX: 10,                  // Max 10 requests per minute
  PROGRESSIVE_DELAY_BASE: 1000,        // 1 second base delay
  CLEANUP_INTERVAL: 3600,              // 1 hour
};

// ============================================
// STORAGE - In-memory cache (auto-cleans after 5 hours)
// ============================================
export const failedLoginCache = new NodeCache({
  stdTTL: CONFIG.LOCKOUT_DURATION_SECONDS,
  checkperiod: 300, // Check every 5 minutes
  useClones: false,
});

// Store lockout status separately for quick checks
export const lockoutCache = new NodeCache({
  stdTTL: CONFIG.LOCKOUT_DURATION_SECONDS,
  checkperiod: 300,
  useClones: false,
});

// IP-based rate limit storage
export const ipRateCache = new NodeCache({
  stdTTL: CONFIG.RATE_LIMIT_WINDOW,
  checkperiod: 60,
  useClones: false,
});

// ============================================
// IP RATE LIMITER - Prevents brute force from same IP
// ============================================
export const loginRateLimiter = rateLimit({
  windowMs: CONFIG.RATE_LIMIT_WINDOW * 1000,
  max: CONFIG.RATE_LIMIT_MAX,
  message: { 
    error: 'Too many login attempts. Please try again in a minute.' 
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too many login attempts. Please try again later.',
      retryAfter: CONFIG.RATE_LIMIT_WINDOW,
    });
  },
});

// ============================================
// FAILED ATTEMPTS TRACKING
// ============================================
interface FailedAttemptData {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
  lockoutUntil: number | null;
  email: string; // Store for notification
}

/**
 * Track failed login attempt and auto-lock after 5 attempts
 */
export const trackFailedAttempt = async (identifier: string): Promise<void> => {
  if (!identifier) return;

  const normalizedIdentifier = identifier.toLowerCase().trim();
  const hashedKey = crypto
    .createHash('sha256')
    .update(normalizedIdentifier)
    .digest('hex');
  
  const cacheKey = `failed_login_${hashedKey}`;
  const lockoutKey = `locked_${hashedKey}`;
  
  try {
    const now = Date.now();
    const existing = failedLoginCache.get<FailedAttemptData>(cacheKey);
    
    let data: FailedAttemptData;
    
    if (existing) {
      // Check if lockout already in effect
      if (existing.lockoutUntil && existing.lockoutUntil > now) {
        // Still locked - just update last attempt time
        data = {
          ...existing,
          lastAttempt: now,
        };
        failedLoginCache.set(cacheKey, data, CONFIG.LOCKOUT_DURATION_SECONDS);
        return;
      }
      
      // Check if lockout expired
      if (existing.lockoutUntil && existing.lockoutUntil <= now) {
        // Reset attempts if lockout expired (auto-unlock)
        failedLoginCache.del(cacheKey);
        lockoutCache.del(lockoutKey);
        
        // Start fresh with count 1
        data = {
          count: 1,
          firstAttempt: now,
          lastAttempt: now,
          lockoutUntil: null,
          email: existing.email || identifier,
        };
      } else {
        // Increment existing attempts
        data = {
          ...existing,
          count: existing.count + 1,
          lastAttempt: now,
        };
        
        // LOCK ACCOUNT IF MAX ATTEMPTS REACHED
        if (data.count >= CONFIG.MAX_FAILED_ATTEMPTS) {
          const lockoutUntil = now + (CONFIG.LOCKOUT_DURATION_SECONDS * 1000);
          data.lockoutUntil = lockoutUntil;
          
          // Store lockout status separately for quick checks
          lockoutCache.set(lockoutKey, {
            locked: true,
            lockoutUntil: lockoutUntil,
            reason: 'Multiple failed login attempts',
          }, CONFIG.LOCKOUT_DURATION_SECONDS);
          
          console.log(`[Security] Account locked for 5 hours: ${identifier}`);
          console.log(`[Security] Auto-unlock at: ${new Date(lockoutUntil).toISOString()}`);
        }
      }
    } else {
      // First failed attempt
      data = {
        count: 1,
        firstAttempt: now,
        lastAttempt: now,
        lockoutUntil: null,
        email: identifier,
      };
    }
    
    // Store with TTL (lockout duration + extra buffer)
    const ttl = CONFIG.LOCKOUT_DURATION_SECONDS + 3600;
    failedLoginCache.set(cacheKey, data, ttl);
    
  } catch (error) {
    console.error('[RateLimiter] Track attempt error:', error);
  }
};

/**
 * Check if account is locked (with auto-unlock logic)
 */
export const isAccountLocked = (identifier: string): { 
  locked: boolean; 
  lockoutUntil: number | null;
  remainingSeconds: number;
} => {
  if (!identifier) {
    return { locked: false, lockoutUntil: null, remainingSeconds: 0 };
  }

  const normalizedIdentifier = identifier.toLowerCase().trim();
  const hashedKey = crypto
    .createHash('sha256')
    .update(normalizedIdentifier)
    .digest('hex');
  
  const lockoutKey = `locked_${hashedKey}`;
  const cacheKey = `failed_login_${hashedKey}`;
  
  // Check lockout status
  const lockoutData = lockoutCache.get<{ 
    locked: boolean; 
    lockoutUntil: number;
    reason: string;
  }>(lockoutKey);
  
  if (lockoutData) {
    const now = Date.now();
    if (lockoutData.lockoutUntil > now) {
      const remainingSeconds = Math.ceil((lockoutData.lockoutUntil - now) / 1000);
      return {
        locked: true,
        lockoutUntil: lockoutData.lockoutUntil,
        remainingSeconds: remainingSeconds,
      };
    } else {
      // Auto-unlock: lockout expired
      lockoutCache.del(lockoutKey);
      failedLoginCache.del(cacheKey);
      return { locked: false, lockoutUntil: null, remainingSeconds: 0 };
    }
  }
  
  // Double-check with failed attempts data
  const data = failedLoginCache.get<FailedAttemptData>(cacheKey);
  if (data && data.lockoutUntil) {
    const now = Date.now();
    if (data.lockoutUntil > now) {
      const remainingSeconds = Math.ceil((data.lockoutUntil - now) / 1000);
      return {
        locked: true,
        lockoutUntil: data.lockoutUntil,
        remainingSeconds: remainingSeconds,
      };
    } else {
      // Auto-unlock: lockout expired
      failedLoginCache.del(cacheKey);
      lockoutCache.del(lockoutKey);
    }
  }
  
  return { locked: false, lockoutUntil: null, remainingSeconds: 0 };
};

/**
 * Get remaining lockout time in human-readable format
 */
export const getRemainingLockoutTime = (identifier: string): string => {
  const status = isAccountLocked(identifier);
  if (!status.locked) return 'Account is not locked';
  
  const hours = Math.floor(status.remainingSeconds / 3600);
  const minutes = Math.floor((status.remainingSeconds % 3600) / 60);
  const seconds = Math.floor(status.remainingSeconds % 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s remaining`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s remaining`;
  } else {
    return `${seconds}s remaining`;
  }
};

/**
 * Reset failed attempts (manual unlock)
 */
export const resetFailedAttempts = (identifier: string): void => {
  if (!identifier) return;
  
  const normalizedIdentifier = identifier.toLowerCase().trim();
  const hashedKey = crypto
    .createHash('sha256')
    .update(normalizedIdentifier)
    .digest('hex');
  
  const cacheKey = `failed_login_${hashedKey}`;
  const lockoutKey = `locked_${hashedKey}`;
  
  failedLoginCache.del(cacheKey);
  lockoutCache.del(lockoutKey);
  
  console.log(`[Security] Manual unlock for: ${identifier}`);
};

/**
 * Account lockout middleware with auto-unlock
 */
export const accountLockout = async (req: Request, res: Response, next: NextFunction) => {
  const { mobile, email } = req.body;
  const identifier = mobile || email;
  
  if (!identifier) {
    return next();
  }

  const normalizedIdentifier = identifier.toLowerCase().trim();
  
  // Check if account is locked
  const lockStatus = isAccountLocked(normalizedIdentifier);
  
  if (lockStatus.locked) {
    // Format remaining time for response
    const hours = Math.floor(lockStatus.remainingSeconds / 3600);
    const minutes = Math.floor((lockStatus.remainingSeconds % 3600) / 60);
    
    let timeMessage = '';
    if (hours > 0) {
      timeMessage = `${hours} hour${hours > 1 ? 's' : ''} and ${minutes} minute${minutes > 1 ? 's' : ''}`;
    } else {
      timeMessage = `${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
    
    // Generic error with auto-unlock time
    return res.status(429).json({
      error: `Account temporarily locked due to multiple failed attempts. Auto-unlock in ${timeMessage}.`,
      lockedUntil: new Date(lockStatus.lockoutUntil!).toISOString(),
      remainingSeconds: lockStatus.remainingSeconds,
      autoUnlockAt: new Date(lockStatus.lockoutUntil!).toISOString(),
    });
  }

  // Apply progressive delay based on failed attempts (1s, 2s, 4s, 8s)
  const hashedKey = crypto
    .createHash('sha256')
    .update(normalizedIdentifier)
    .digest('hex');
  
  const cacheKey = `failed_login_${hashedKey}`;
  const data = failedLoginCache.get<FailedAttemptData>(cacheKey);
  
  if (data && data.count > 0 && data.count < CONFIG.MAX_FAILED_ATTEMPTS) {
    const baseDelay = Math.pow(2, data.count - 1) * CONFIG.PROGRESSIVE_DELAY_BASE;
    const delay = Math.min(baseDelay, 10000); // Cap at 10 seconds
    
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  next();
};

// ============================================
// ADMIN FUNCTIONS (Optional - for manual override)
// ============================================

/**
 * Get lockout status for all users (for monitoring)
 */
export const getLockoutStatus = (): Array<{
  identifier: string;
  locked: boolean;
  remainingSeconds: number;
  lockoutUntil: Date | null;
}> => {
  const keys = lockoutCache.keys();
  const statuses = [];
  
  for (const key of keys) {
    // Decode the key to get the original identifier
    const data = lockoutCache.get<{
      locked: boolean;
      lockoutUntil: number;
      reason: string;
    }>(key);
    
    if (data && data.locked) {
      const now = Date.now();
      if (data.lockoutUntil > now) {
        statuses.push({
          identifier: key.replace('locked_', ''),
          locked: true,
          remainingSeconds: Math.ceil((data.lockoutUntil - now) / 1000),
          lockoutUntil: new Date(data.lockoutUntil),
        });
      }
    }
  }
  
  return statuses;
};

/**
 * Force unlock account (admin only)
 */
export const forceUnlockAccount = (identifier: string): boolean => {
  if (!identifier) return false;
  
  try {
    const normalizedIdentifier = identifier.toLowerCase().trim();
    const hashedKey = crypto
      .createHash('sha256')
      .update(normalizedIdentifier)
      .digest('hex');
    
    const cacheKey = `failed_login_${hashedKey}`;
    const lockoutKey = `locked_${hashedKey}`;
    
    failedLoginCache.del(cacheKey);
    lockoutCache.del(lockoutKey);
    
    console.log(`[Security] Force unlock: ${identifier}`);
    return true;
  } catch (error) {
    console.error('[Security] Force unlock failed:', error);
    return false;
  }
};

// ============================================
// AUTO CLEANUP - Runs automatically
// ============================================
if (process.env.NODE_ENV === 'production') {
  setInterval(() => {
    const keys = lockoutCache.keys();
    const now = Date.now();
    
    for (const key of keys) {
      const data = lockoutCache.get<{
        locked: boolean;
        lockoutUntil: number;
        reason: string;
      }>(key);
      
      if (data && data.lockoutUntil && data.lockoutUntil <= now) {
        lockoutCache.del(key);
        const cacheKey = key.replace('locked_', 'failed_login_');
        failedLoginCache.del(cacheKey);
        console.log(`[Security] Auto-unlocked account: ${key}`);
      }
    }
  }, 60000); // Check every minute
}

