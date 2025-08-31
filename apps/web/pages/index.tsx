import React, { useState, useEffect } from 'react';
import Head from 'next/head';

interface DemoData {
  poses: Array<{
    id: string;
    title: string;
    theme: string;
    imageUrl: string;
    tags: string[];
    variants: number;
  }>;
  stats: {
    totalPoses: number;
    themes: number;
    variants: number;
    downloads: number;
  };
}

export default function HomePage() {
  const [demoData] = useState<DemoData>({
    poses: [
      {
        id: '1',
        title: 'Classic Portrait Standing',
        theme: 'Portrait',
        imageUrl: '/api/placeholder/300/400',
        tags: ['Standing', 'Eye Contact', '85mm'],
        variants: 4
      },
      {
        id: '2', 
        title: 'Wedding Couple Embrace',
        theme: 'Wedding',
        imageUrl: '/api/placeholder/300/400',
        tags: ['Couple', 'Romantic', 'Outdoor'],
        variants: 6
      },
      {
        id: '3',
        title: 'Family Group Portrait',
        theme: 'Family',
        imageUrl: '/api/placeholder/300/400', 
        tags: ['Group', 'Sitting', 'Natural'],
        variants: 3
      }
    ],
    stats: {
      totalPoses: 2847,
      themes: 12,
      variants: 8932,
      downloads: 125643
    }
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('All');
  const [typedText, setTypedText] = useState('');

  const heroText = "Professional Pose Reference Library";
  
  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      if (i < heroText.length) {
        setTypedText(heroText.slice(0, i + 1));
        i++;
      } else {
        clearInterval(timer);
      }
    }, 100);
    return () => clearInterval(timer);
  }, []);

  const themes = ['All', 'Portrait', 'Wedding', 'Family', 'Newborn', 'Fashion', 'Business'];

  return (
    <>
      <Head>
        <title>PoseKit - Professional Pose Reference Library for Photographers</title>
        <meta name="description" content="The ultimate pose reference database with 2800+ professional poses, AI prompts, skeleton overlays, and instant downloads. Trusted by photographers worldwide." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="PoseKit - Professional Pose Reference Library" />
        <meta property="og:description" content="2800+ professional poses with AI prompts and skeleton overlays" />
        <meta property="og:type" content="website" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Navigation */}
        <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">📸</span>
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  PoseKit
                </span>
              </div>
              <div className="hidden md:flex items-center space-x-8">
                <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a>
                <a href="#poses" className="text-gray-600 hover:text-gray-900 transition-colors">Browse Poses</a>
                <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                  Get Started
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className="text-center">
            <div className="mb-8">
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mb-6">
                🚀 Over {demoData.stats.downloads.toLocaleString()} downloads worldwide
              </span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 mb-6 leading-tight">
              <span className="block">📸 PoseKit</span>
              <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                {typedText}
                <span className="animate-pulse">|</span>
              </span>
            </h1>
            
            <p className="text-xl lg:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
              The ultimate pose reference database with <strong>{demoData.stats.totalPoses.toLocaleString()}+ professional poses</strong>, 
              AI prompts, skeleton overlays, and instant downloads. Trusted by photographers worldwide.
            </p>

            {/* Hero Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{demoData.stats.totalPoses.toLocaleString()}+</div>
                <div className="text-gray-600 text-sm">Professional Poses</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{demoData.stats.themes}+</div>
                <div className="text-gray-600 text-sm">Categories</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-indigo-600">{demoData.stats.variants.toLocaleString()}+</div>
                <div className="text-gray-600 text-sm">Variants</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{demoData.stats.downloads.toLocaleString()}+</div>
                <div className="text-gray-600 text-sm">Downloads</div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-4 px-8 rounded-xl text-lg transition-all duration-200 transform hover:scale-105 shadow-lg">
                🚀 Explore Poses Library
              </button>
              <button className="border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold py-4 px-8 rounded-xl text-lg transition-colors">
                📖 View Documentation
              </button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="bg-white py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Why Photographers Choose PoseKit
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Professional tools designed specifically for photographers who need reliable pose references
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
              {/* Smart Search */}
              <div className="group hover:scale-105 transition-transform duration-200">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 h-full">
                  <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">🔍 Smart Search</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Fuse.js powered fuzzy search with synonyms, multi-language support, and intelligent filtering. 
                    Find the perfect pose in seconds with natural language queries.
                  </p>
                  <div className="mt-6 p-3 bg-white rounded-lg text-sm text-gray-500 border">
                    💡 Try: "wedding standing sunset 85mm"
                  </div>
                </div>
              </div>

              {/* Instant Copy */}
              <div className="group hover:scale-105 transition-transform duration-200">
                <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-8 h-full">
                  <div className="w-16 h-16 bg-green-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">⚡ Instant Copy</h3>
                  <p className="text-gray-600 leading-relaxed">
                    One-click copying of PNG images, JSON keypoints, and AI prompts. 
                    Keyboard shortcuts (Enter/C/P) for lightning-fast workflow.
                  </p>
                  <div className="mt-6 flex gap-2">
                    <span className="px-3 py-1 bg-white rounded-md text-xs font-mono border">⏎ PNG</span>
                    <span className="px-3 py-1 bg-white rounded-md text-xs font-mono border">C JSON</span>
                    <span className="px-3 py-1 bg-white rounded-md text-xs font-mono border">P Prompt</span>
                  </div>
                </div>
              </div>

              {/* Pose Variants */}
              <div className="group hover:scale-105 transition-transform duration-200">
                <div className="bg-gradient-to-br from-purple-50 to-violet-100 rounded-2xl p-8 h-full">
                  <div className="w-16 h-16 bg-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">🔄 Pose Variants</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Mirror, angle, and lens variations for each pose. Switch between different perspectives 
                    with arrow keys or variant selector.
                  </p>
                  <div className="mt-6 grid grid-cols-3 gap-2">
                    <div className="h-8 bg-white rounded border"></div>
                    <div className="h-8 bg-blue-100 rounded border border-blue-300"></div>
                    <div className="h-8 bg-white rounded border"></div>
                  </div>
                </div>
              </div>

              {/* Safety Guidelines */}
              <div className="group hover:scale-105 transition-transform duration-200">
                <div className="bg-gradient-to-br from-amber-50 to-orange-100 rounded-2xl p-8 h-full">
                  <div className="w-16 h-16 bg-amber-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">⚠️ Safety First</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Built-in safety alerts for newborn and sensitive poses. Clear guidelines 
                    for professional and ethical photography practices.
                  </p>
                  <div className="mt-6 flex gap-2">
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Normal</span>
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">Caution</span>
                    <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">Restricted</span>
                  </div>
                </div>
              </div>

              {/* Favorites & Export */}
              <div className="group hover:scale-105 transition-transform duration-200">
                <div className="bg-gradient-to-br from-pink-50 to-rose-100 rounded-2xl p-8 h-full">
                  <div className="w-16 h-16 bg-pink-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">💾 Smart Collections</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Local favorites system with batch export to ZIP. Create custom collections 
                    and download everything for offline shoots.
                  </p>
                  <div className="mt-6 p-3 bg-white rounded-lg text-sm text-gray-500 border">
                    📦 Export: PNG + JSON + Prompts
                  </div>
                </div>
              </div>

              {/* PWA Offline */}
              <div className="group hover:scale-105 transition-transform duration-200">
                <div className="bg-gradient-to-br from-teal-50 to-cyan-100 rounded-2xl p-8 h-full">
                  <div className="w-16 h-16 bg-teal-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">📱 PWA Ready</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Progressive Web App with offline capabilities. Install on any device 
                    and access your pose library without internet connection.
                  </p>
                  <div className="mt-6 p-3 bg-white rounded-lg text-sm text-gray-500 border">
                    📱 Works on iOS, Android, Desktop
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Demo */}
        <section id="poses" className="py-24 bg-gradient-to-br from-gray-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Try PoseKit Right Now
              </h2>
              <p className="text-xl text-gray-600">
                Interactive demo with real pose data and features
              </p>
            </div>

            {/* Search Demo */}
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-12">
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="lg:w-1/3">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">🔍 Smart Search</h3>
                  
                  {/* Search Bar */}
                  <div className="relative mb-6">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search poses... (e.g. 'wedding couple outdoor')"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                    />
                    <div className="absolute right-3 top-3 text-gray-400">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>

                  {/* Theme Filter */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select 
                      value={selectedTheme}
                      onChange={(e) => setSelectedTheme(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                    >
                      {themes.map(theme => (
                        <option key={theme} value={theme}>{theme}</option>
                      ))}
                    </select>
                  </div>

                  <div className="text-sm text-gray-500">
                    💡 <strong>Pro tip:</strong> Use keyboard shortcuts (⌘K to search, ⏎ to copy PNG, C for JSON)
                  </div>
                </div>

                {/* Pose Grid Demo */}
                <div className="lg:w-2/3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {demoData.poses.map((pose, index) => (
                      <div key={pose.id} className="group cursor-pointer">
                        <div className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                          {/* Demo Image Placeholder */}
                          <div className="relative aspect-[4/5] bg-gradient-to-br from-gray-100 to-gray-200">
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="text-center text-gray-400">
                                <div className="w-20 h-20 mx-auto mb-4 bg-gray-300 rounded-full flex items-center justify-center">
                                  <span className="text-2xl">👤</span>
                                </div>
                                <div className="text-sm font-medium">{pose.title}</div>
                              </div>
                            </div>
                            
                            {/* Copy Actions */}
                            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                              <button className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors text-sm">
                                🖼
                              </button>
                              <button className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors text-sm">
                                📄
                              </button>
                              <button className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors text-sm">
                                ✍️
                              </button>
                            </div>

                            {/* Variant Indicator */}
                            <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/70 text-white text-xs rounded-full">
                              {pose.variants} variants
                            </div>
                          </div>

                          {/* Card Content */}
                          <div className="p-4">
                            <h4 className="font-semibold text-gray-900 mb-2">{pose.title}</h4>
                            <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">{pose.theme}</span>
                              <span>👁 1.2k views</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {pose.tags.slice(0, 2).map((tag, tagIndex) => (
                                <span key={tag} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                                  {tag}
                                </span>
                              ))}
                              {pose.tags.length > 2 && (
                                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                                  +{pose.tags.length - 2}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="text-center mt-8">
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors">
                      View All {demoData.stats.totalPoses.toLocaleString()}+ Poses →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tech Stack */}
        <section className="py-24 bg-gray-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">Built with Modern Technology</h2>
              <p className="text-xl text-gray-300">
                Production-ready architecture designed for scale and performance
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold">⚛️</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Next.js 14</h3>
                <p className="text-gray-400 text-sm">React framework with SSG</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-green-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold">🟢</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Node.js API</h3>
                <p className="text-gray-400 text-sm">Express + Drizzle ORM</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold">🐘</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">PostgreSQL</h3>
                <p className="text-gray-400 text-sm">Full-text search + Redis</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold">🐳</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Docker</h3>
                <p className="text-gray-400 text-sm">Container deployment</p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">📸</span>
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  PoseKit
                </span>
              </div>
              
              <p className="text-gray-600 mb-6">
                Professional pose reference library for photographers worldwide
              </p>
              
              <div className="flex justify-center space-x-6 text-sm text-gray-500">
                <a href="#" className="hover:text-gray-700 transition-colors">Documentation</a>
                <a href="#" className="hover:text-gray-700 transition-colors">GitHub</a>
                <a href="#" className="hover:text-gray-700 transition-colors">Support</a>
                <a href="#" className="hover:text-gray-700 transition-colors">Privacy</a>
              </div>
              
              <div className="mt-8 pt-8 border-t border-gray-200 text-gray-500 text-sm">
                Made with ❤️ for photographers worldwide • © 2024 PoseKit
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}