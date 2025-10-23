import Navbar from '@/components/home/navbar';
import Footer from '@/components/home/footer';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-blue-500 to-blue-700 text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-5xl font-bold mb-6">Welcome to CodeTantra SRM</h1>
            <p className="text-xl mb-8 text-blue-100">
              Your Ultimate Learning and Testing Platform
            </p>
            <div className="flex justify-center gap-4">
              <a href="/login" className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors duration-200">
                Get Started
              </a>
              <a href="/features" className="bg-blue-600 text-white border-2 border-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors duration-200">
                Learn More
              </a>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-bold text-center text-black mb-12">Our Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-200">
                <div className="text-blue-600 mb-4">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold text-black mb-3">E-Lab</h3>
                <p className="text-gray-700">
                  Access virtual labs and practice coding in a real-time environment with instant feedback.
                </p>
              </div>

              <div className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-200">
                <div className="text-blue-600 mb-4">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold text-black mb-3">Online Tests</h3>
                <p className="text-gray-700">
                  Take assessments and track your progress with comprehensive analytics and reporting.
                </p>
              </div>

              <div className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-200">
                <div className="text-blue-600 mb-4">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold text-black mb-3">Advanced Features</h3>
                <p className="text-gray-700">
                  Explore cutting-edge learning tools, AI-powered insights, and personalized learning paths.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-blue-600 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Start Learning?</h2>
            <p className="text-xl mb-8 text-blue-100">
              Join thousands of students already using CodeTantra SRM
            </p>
            <a href="/login" className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors duration-200 inline-block">
              Login Now
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
