import { redirect } from 'next/navigation'
import Link from 'next/link'

export default function SignupPage() {
  return (
    <main className="flex-1 flex items-center justify-center min-h-[100vh] p-4 py-12">
      <div className="w-full max-w-xl glass-panel p-8 relative overflow-hidden">
        {/* Decorative corner */}
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-accent-500/20 rounded-full blur-2xl pointer-events-none" />
        
        <div className="text-center mb-8 relative z-10">
          <Link href="/">
            <h1 className="font-outfit text-3xl font-bold tracking-tight text-white inline-flex items-center gap-2">
              <span className="text-brand-400">SIWA</span> OASIS
            </h1>
          </Link>
          <h2 className="text-xl font-semibold text-white mt-4">Join the Premium Marketplace</h2>
          <p className="text-slate-400 mt-2 text-sm">Register your business to reach thousands of travelers</p>
        </div>

        <form className="space-y-5 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">First Name</label>
              <input type="text" name="first_name" required className="input-field" placeholder="John" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Last Name</label>
              <input type="text" name="last_name" required className="input-field" placeholder="Doe" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Email Address</label>
            <input type="email" name="email" required className="input-field" placeholder="hello@yourbusiness.com" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
            <input type="password" name="password" required className="input-field" placeholder="••••••••" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Primary Business Type</label>
            <select name="business_type" required className="input-field bg-slate-900 border-slate-700">
              <optgroup label="Accommodations">
                <option value="hotel">Hotel / Eco-Lodge</option>
                <option value="camp">Desert Camp</option>
              </optgroup>
              <optgroup label="Activities">
                <option value="tour">Tour Operator</option>
                <option value="safari">Safari & Expeditions</option>
              </optgroup>
              <optgroup label="Food & Dining">
                <option value="restaurant">Restaurant / Cafe</option>
              </optgroup>
            </select>
          </div>

          <div className="pt-2">
            <button type="submit" className="w-full btn-primary">
              Create Vendor Account
            </button>
          </div>
          
          <p className="text-xs text-slate-500 text-center mt-4">
            By registering, you agree to our Terms of Service and Privacy Policy. All accounts require admin review before publication.
          </p>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-700/50 text-center relative z-10">
          <p className="text-sm text-slate-400">
            Already have an account?{' '}
            <Link href="/login" className="text-brand-400 hover:text-brand-300 transition-colors font-medium">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
