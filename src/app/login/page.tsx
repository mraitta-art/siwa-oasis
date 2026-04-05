import { redirect } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <main className="flex-1 flex items-center justify-center min-h-[100vh] p-4">
      <div className="w-full max-w-md glass-panel p-8 relative overflow-hidden">
        {/* Decorative corner */}
        <div className="absolute -top-12 -right-12 w-24 h-24 bg-brand-500/30 rounded-full blur-xl pointer-events-none" />
        
        <div className="text-center mb-8 relative z-10">
          <Link href="/">
            <h1 className="font-outfit text-3xl font-bold tracking-tight text-white inline-flex items-center gap-2">
              <span className="text-brand-400">SIWA</span> OASIS
            </h1>
          </Link>
          <p className="text-slate-400 mt-2 text-sm">Sign in to your vendor dashboard</p>
        </div>

        <form className="space-y-5 relative z-10">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Email Address</label>
            <input 
              type="email" 
              name="email" 
              required 
              className="input-field" 
              placeholder="vendor@siwa.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
            <input 
              type="password" 
              name="password" 
              required 
              className="input-field" 
              placeholder="••••••••"
            />
            <div className="flex justify-end mt-1">
              <a href="#" className="text-xs text-brand-400 hover:text-brand-300 transition-colors">Forgot password?</a>
            </div>
          </div>

          <button type="submit" className="w-full btn-primary mt-6">
            Sign In Securely
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-700/50 text-center relative z-10">
          <p className="text-sm text-slate-400">
            Don't have an account?{' '}
            <Link href="/signup" className="text-brand-400 hover:text-brand-300 transition-colors font-medium">
              Apply as a Vendor
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
