import React from 'react';
import Head from 'next/head';

export default function HomePage() {
  return (
    <>
      <Head>
        <title>PoseKit - Professional Pose Reference Library</title>
        <meta name="description" content="Professional photography pose database with skeleton overlays, AI prompts, and instant download capabilities." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-gray-900 mb-8">
              📸 PoseKit
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
              Professional pose reference library for photographers and artists. 
              Discover, copy, and download pose references with AI prompts and skeleton overlays.
            </p>
            
            <div className="grid md:grid-cols-3 gap-8 mt-16">
              <div className="bg-white rounded-xl p-8 shadow-lg">
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold mb-2">Smart Search</h3>
                <p className="text-gray-600">Fuse.js powered search with synonyms and multi-language support</p>
              </div>
              
              <div className="bg-white rounded-xl p-8 shadow-lg">
                <div className="text-4xl mb-4">🖼️</div>
                <h3 className="text-xl font-semibold mb-2">Instant Copy</h3>
                <p className="text-gray-600">PNG/JSON/Prompt copying with keyboard shortcuts</p>
              </div>
              
              <div className="bg-white rounded-xl p-8 shadow-lg">
                <div className="text-4xl mb-4">🔄</div>
                <h3 className="text-xl font-semibold mb-2">Pose Variants</h3>
                <p className="text-gray-600">Mirror, angle, and lens variations for each pose</p>
              </div>
            </div>
            
            <div className="mt-16">
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-colors">
                Explore Poses
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}