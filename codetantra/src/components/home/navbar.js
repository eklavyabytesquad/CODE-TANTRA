import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold">
              CodeTantra SRM
            </Link>
          </div>
          <div className="hidden md:flex space-x-8">
            <Link href="/elab" className="hover:text-blue-200 transition-colors duration-200">
              E-Lab
            </Link>
            <Link href="/test" className="hover:text-blue-200 transition-colors duration-200">
              Test
            </Link>
            <Link href="/features" className="hover:text-blue-200 transition-colors duration-200">
              Features
            </Link>
            <Link href="/login" className="bg-white text-blue-600 px-4 py-2 rounded-md hover:bg-blue-50 transition-colors duration-200">
              Login
            </Link>
          </div>
          <div className="md:hidden">
            <button className="text-white focus:outline-none">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
