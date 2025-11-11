export function MessageListSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-4">
          {/* User message skeleton */}
          <div className="flex items-start gap-3 justify-end animate-pulse">
            <div className="max-w-[80%] space-y-2">
              <div className="h-4 w-32 bg-gradient-to-r from-blue-200 to-purple-200 rounded"></div>
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900">
                <div className="space-y-2">
                  <div className="h-4 bg-blue-300 dark:bg-blue-700 rounded w-full"></div>
                  <div className="h-4 bg-blue-300 dark:bg-blue-700 rounded w-3/4"></div>
                </div>
              </div>
            </div>
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400"></div>
          </div>

          {/* AI message skeleton */}
          <div className="flex items-start gap-3 animate-pulse">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400"></div>
            <div className="max-w-[80%] space-y-2">
              <div className="h-4 w-24 bg-gradient-to-r from-emerald-200 to-cyan-200 rounded"></div>
              <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-5/6"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-4/5"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-2/3"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
