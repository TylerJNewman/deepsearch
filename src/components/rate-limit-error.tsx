import { AlertTriangle, Clock, Shield } from "lucide-react";

interface RateLimitErrorProps {
  message: string;
  requestsToday?: number;
  dailyLimit?: number;
  resetTime?: string;
}

export const RateLimitError = ({ 
  message, 
  requestsToday, 
  dailyLimit,
  resetTime 
}: RateLimitErrorProps) => {
  const resetDate = resetTime ? new Date(resetTime) : new Date(Date.now() + 24 * 60 * 60 * 1000);
  const hoursUntilReset = Math.ceil((resetDate.getTime() - Date.now()) / (1000 * 60 * 60));

  return (
    <div className="mx-auto w-full max-w-[65ch]">
      <div className="rounded-lg border border-amber-700 bg-amber-900/20 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="size-6 shrink-0 text-amber-400 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-amber-200 mb-2">
              Rate Limit Reached
            </h3>
            <p className="text-amber-100 mb-3">
              {message}
            </p>
            
            {requestsToday !== undefined && dailyLimit !== undefined && (
              <div className="mb-3">
                <div className="flex items-center justify-between text-sm text-amber-200 mb-1">
                  <span>Daily Usage</span>
                  <span>{requestsToday}/{dailyLimit} requests</span>
                </div>
                <div className="w-full bg-amber-900/40 rounded-full h-2">
                  <div 
                    className="bg-amber-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((requestsToday / dailyLimit) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-2 text-sm text-amber-200">
              <Clock className="size-4" />
              <span>
                Your limit will reset in approximately {hoursUntilReset} hour{hoursUntilReset !== 1 ? 's' : ''}
              </span>
            </div>
            
            <div className="mt-3 pt-3 border-t border-amber-700/50">
              <div className="flex items-center gap-2 text-xs text-amber-300">
                <Shield className="size-3" />
                <span>Rate limits help us maintain service quality and manage costs</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 