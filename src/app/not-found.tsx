import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-slate-50 dark:bg-slate-950">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-sm max-w-md w-full">
        <h2 className="text-4xl font-black text-slate-800 dark:text-white mb-2">404</h2>
        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-2">Page Not Found</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 font-semibold">
          The requested page could not be found or you may not have authorization to view it.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center w-full px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider transition-all"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
