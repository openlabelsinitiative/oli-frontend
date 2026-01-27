'use client';

import type { FC } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PRODUCTS_USING_OLI, DEFAULT_PRODUCT_COLOR } from '@/constants/products';

const HomePage: FC = () => {

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gray-50 py-16 relative overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-blue-400"></div>
          <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-pink-500"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            {/* Logo */}
            <div className="flex justify-center mb-12">
              <Image
                src="/oli-logo.png"
                alt="Open Labels Initiative Logo"
                width={500}
                height={500}
                className="object-contain"
              />
            </div>
            
            <p className="mt-6 mx-auto max-w-none whitespace-nowrap text-xl text-gray-500 sm:text-2xl md:text-3xl font-light leading-relaxed">
              A Standard, Registry and Trust Layer for EVM<span className="oli-typing">/non-EVM</span> Address Labels.
            </p>
            
            <div className="mt-8 mx-auto sm:flex sm:justify-center">
              {/* GitHub Repository Button */}
              <div>
                <a
                  href="https://github.com/openlabelsinitiative/OLI"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center px-8 py-3 text-base font-medium rounded-xl text-white bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 hover:opacity-90 md:py-4 md:text-lg md:px-10 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <svg className="h-6 w-6 mr-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                  GitHub Repository
                </a>
              </div>
              
              {/* Community Calls Button */}
              <div className="mt-3 sm:mt-0 sm:ml-3">
                <a
                  href="https://t.me/olilabels"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center px-8 py-3 border border-gray-300 font-medium rounded-xl text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  Join our Telegram Group
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        .oli-typing {
          display: inline-block;
          overflow: hidden;
          white-space: nowrap;
          vertical-align: bottom;
          max-width: 0;
          border-right: 2px solid rgba(167, 139, 250, 0.9);
          animation:
            oli-typing 1.5s steps(8) 0.6s forwards,
            oli-caret 0.9s steps(1) 0.6s 3;
          animation-fill-mode: forwards, forwards;
        }

        @keyframes oli-typing {
          from {
            max-width: 0;
          }
          to {
            max-width: 8ch;
          }
        }

        @keyframes oli-caret {
          0%, 50% {
            border-color: rgba(167, 139, 250, 0.9);
          }
          51%, 100% {
            border-color: transparent;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .oli-typing {
            width: auto;
            border-right: none;
            animation: none;
          }
        }
      `}</style>

      {/* Problem Statement Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900">
              Why OLI?
            </h2>
            <p className="mt-4 max-w-3xl mx-auto text-xl text-gray-500">
              Blockchains need labels to be understandable, yet Web3 lacks a universal system for creating and sharing them.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Problem Card 1 */}
            <div className="bg-white border border-blue-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              <div className="text-red-600 mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.316 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Centralized Label Silos
              </h3>
              <p className="text-gray-600">
                Labels are fragmented across many centralized data silos, often locked behind expensive paywalls.
              </p>
            </div>

            {/* Problem Card 2 */}
            <div className="bg-white border border-purple-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              <div className="text-yellow-600 mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Redundant Labeling Efforts
              </h3>
              <p className="text-gray-600">
                Each data team is forced to recreate the same labels independently, resulting in substantial redundant work across the ecosystem.
              </p>
            </div>

            {/* Problem Card 3 */}
            <div className="bg-white border border-pink-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              <div className="text-red-600 mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                User Vulnerability
              </h3>
              <p className="text-gray-600">
                Users are vulnerable to scams because of poor labeling; better standards could easily fix this.
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 rounded-lg text-white font-medium">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              OLI provides the missing universal, human-readable address book for Web3
            </div>
          </div>
        </div>
      </div>

{/* The 3 Pillars Section with Tags */}
<div className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 py-16">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="text-center">
      <h2 className="text-3xl font-extrabold text-white">
        The Three Pillars of OLI
      </h2>
      <p className="mt-4 max-w-3xl mx-auto text-xl text-blue-100">
        OLI is built on three composable pillars that build on top of each other to create a rich and reliable data ecosystem
      </p>
      
      {/* Explainer Button */}
      <div className="mt-8 flex justify-center">
        <a
          href="https://x.com/oli_labels/status/1855979653926510828"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-6 py-3 border-2 border-white font-medium rounded-xl text-white hover:bg-white hover:text-purple-600 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Watch 12-min Explainer
        </a>
      </div>
    </div>
    <div className="mt-12 grid gap-8 grid-cols-1 md:grid-cols-3" style={{ gridAutoRows: '1fr' }}>
      {/* Data Model Pillar */}
      <div className="bg-white overflow-hidden shadow rounded-xl hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col h-full">
        <div className="px-6 py-8 flex flex-col flex-grow">
          <div className="flex items-center mb-4">
            <div className="p-2 rounded-lg bg-blue-100 mr-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Label Schema</h3>
              <p className="text-sm text-gray-600 font-medium">Data Model & Tag Definitions</p>
              <div className="flex mt-1 space-x-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                 standard
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  composable
                </span>
              </div>
            </div>
          </div>
          <p className="mt-2 text-base text-gray-500 mb-6 flex-grow">
            The foundation: A shared data model for labels. An open standard that ensures everyone speaks the same language, making labels composable.
          </p>
          <Link href="/docs?section=label-schema" className="inline-flex items-center text-indigo-600 hover:text-indigo-500 font-medium">
            View documentation
            <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Label Pool Pillar */}
      <div className="bg-white overflow-hidden shadow rounded-xl hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col h-full">
        <div className="px-6 py-8 flex flex-col flex-grow">
          <div className="flex items-center mb-4">
            <div className="p-2 rounded-lg bg-purple-100 mr-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Label Pool</h3>
              <p className="text-sm text-gray-600 font-medium">Label Pool & Data Entry</p>
              <div className="flex mt-1 space-x-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  decentralized
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  EAS
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  API
                </span>
              </div>
            </div>
          </div>
          <p className="mt-2 text-base text-gray-500 mb-6 flex-grow">
            Built on the Label Schema, the Label Pool is a decentralized, onchain label registry powered by EAS. The central hub where you contribute once and your labels are seen everywhere.
          </p>
          <Link href="/docs?section=label-pool" className="inline-flex items-center text-indigo-600 hover:text-indigo-500 font-medium">
            View documentation
            <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Label Confidence Pillar */}
      <div className="bg-white overflow-hidden shadow rounded-xl hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col h-full">
        <div className="px-6 py-8 flex flex-col flex-grow">
          <div className="flex items-center mb-4">
            <div className="p-2 rounded-lg bg-pink-100 mr-4">
              <svg className="w-8 h-8 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Label Trust</h3>
              <p className="text-sm text-gray-600 font-medium">Label Confidence & Trust Algorithms</p>
              <div className="flex mt-1 space-x-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                  algorithms
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                  confidence
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                  security
                </span>
              </div>
            </div>
          </div>
          <p className="mt-2 text-base text-gray-500 mb-6 flex-grow">
            An algorithmic layer that transforms raw, crowd-sourced labels from the Label Pool into high-quality, reliable, and production-ready labels for your project.
          </p>
          <Link href="/docs?section=label-trust" className="inline-flex items-center text-indigo-600 hover:text-indigo-500 font-medium">
            View documentation
            <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
    {/* FAQ Section */}
    <div className="mt-6 text-center">
        <h3 className="text-xl font-semibold text-white mb-2">Still have questions?</h3>
        <Link
          href="/docs?section=overview"
          className="inline-flex items-center justify-center px-12 py-4 bg-white text-purple-600 font-semibold rounded-lg hover:bg-gray-50 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl min-w-80"
          onClick={() => {
            // Set a flag in sessionStorage to scroll to FAQ after navigation
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('scrollToFAQ', 'true');
            }
          }}
        >
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          View Frequently Asked Questions
        </Link>
      </div>
  </div>
</div>


      {/* How to Get Involved Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900">
              How to Start Using OLI
            </h2>
            <p className="mt-4 max-w-3xl mx-auto text-xl text-gray-500">
              OLI is built to be used. Find and share contract labels once, and use them everywhere.
            </p>
          </div>

          {/* Foundation Card - Label Schema */}
          <div className="mb-8">
            <div className="bg-white rounded-xl shadow-lg border-2 border-indigo-200 p-8 text-center relative overflow-hidden">
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-indigo-400"></div>
                <div className="absolute -bottom-12 -left-12 w-24 h-24 rounded-full bg-purple-500"></div>
              </div>
              
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full mb-6">
                  <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                
                <h3 className="text-3xl font-bold text-gray-900 mb-2">Adopt the Label Schema</h3>
                <p className="text-xl text-indigo-600 font-medium mb-6">🏗️ The Foundation for Everyone</p>
                
                <p className="text-gray-700 mb-6 max-w-3xl mx-auto leading-relaxed">
                  Whether you&apos;re consuming labels, producing labels or building community tools, everything starts with understanding the OLI Label Schema. This is your essential first step.
                </p>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="text-indigo-500 mr-2">✓</span>
                    Standardized data model
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="text-indigo-500 mr-2">✓</span>
                    Community owned
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="text-indigo-500 mr-2">✓</span>
                    Flexible tag definitions
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="text-indigo-500 mr-2">✓</span>
                    Infinitely Extensible
                  </div>
                  
                </div>
                
                <a
                  href="/docs?section=label-schema"
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:opacity-90 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl text-lg"
                >
                  Start with Label Schema
                  <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Connection Arrow */}
          <div className="text-center mb-8">
            <div className="inline-flex flex-col items-center">
              <div className="w-px h-8 bg-gradient-to-b from-indigo-300 to-purple-400"></div>
              <div className="bg-white border-2 border-indigo-200 rounded-full p-2 mb-2">
                <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-600 bg-white px-4 py-2 rounded-full border border-gray-200">
                Then choose your path
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" style={{ gridAutoRows: '1fr' }}>
            {/* Data Consumers */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col h-full">
              <div className="flex items-center mb-4">
                <div className="p-2 rounded-lg bg-green-100 mr-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Data Consumers</h3>
                  <p className="text-sm text-gray-600">Wallets, dApps, Developers</p>
                </div>
              </div>
              <div className="flex-grow">
                <p className="text-gray-600 mb-4">
                  Stop dealing with hex addresses. Integrate the Label Pool to provide your users with rich context about addresses and security warnings.
                </p>
                <ul className="space-y-2 text-sm text-gray-600 mb-4">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  Integrate in minutes with TypeScript SDK or Python package
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  Enhance UX with human-readable context
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  Browse and search label coverage and request labels
                </li>
                </ul>
              </div>
              <Link href="/docs?section=label-pool" className="inline-flex items-center text-indigo-600 hover:text-indigo-500 font-medium">
                Integration guides
                <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>

            {/* Label Producers */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col h-full">
              <div className="flex items-center mb-4">
                <div className="p-2 rounded-lg bg-blue-100 mr-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Label Producers</h3>
                  <p className="text-sm text-gray-600">L2 Teams, Explorers, Security Firms, Applications</p>
                </div>
              </div>
              <div className="flex-grow">
                <p className="text-gray-600 mb-4">
                  Your labels are a public good. Contribute them to increase your project&apos;s visibility and security across Web3.
                </p>
                <ul className="space-y-2 text-sm text-gray-600 mb-4">
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  Contribute in seconds via web UI or tools
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  Boost reach across wallets and dApps
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  Build reputation as trusted contributor
                </li>
                </ul>
              </div>
              <Link href="/attest" className="inline-flex items-center text-indigo-600 hover:text-indigo-500 font-medium">
                Start contributing
                <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>

            {/* Community */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col h-full">
              <div className="flex items-center mb-4">
                <div className="p-2 rounded-lg bg-purple-100 mr-4">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Community</h3>
                  <p className="text-sm text-gray-600">Researchers, Analysts, Power Users</p>
                </div>
              </div>
              <div className="flex-grow">
                <p className="text-gray-600 mb-4">
                  The Label Pool is a public good, owned by the community. Your expertise is critical to its success.
                </p>
                <ul className="space-y-2 text-sm text-gray-600 mb-4">
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  Explore data and uncover new insights
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  Add labels for contracts you discover
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  Join governance and contribute to the discussions
                </li>
                </ul>
              </div>
              <a href="https://t.me/olilabels" target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-indigo-600 hover:text-indigo-500 font-medium">
                Join community
                <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>


    {/* Call to Action Section */}
    <div className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 py-16">
  <div className="max-w-7xl mx-auto text-center py-6 px-4 sm:py-6 sm:px-6 lg:px-8">
      <h2 className="text-3xl font-extrabold text-white mb-12">
        <span className="block">Using the OLI Label Pool</span>
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8" style={{ gridAutoRows: '1fr' }}>
        {/* Search Card */}
        <Link
          href="/search"
          className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group flex flex-col h-full"
        >
          <div className="flex flex-col items-center flex-grow">
            <div className="h-14 w-14 text-indigo-600 mb-5 p-3 bg-indigo-50 rounded-full">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-indigo-600">
              Search Contracts
            </h3>
            <p className="text-gray-600 mb-4 flex-grow">
              Explore and discover labeled smart contracts. Find detailed information about EVM/non-EVM addresses.
            </p>
            <div className="mt-auto flex items-center text-indigo-600 text-sm font-medium">
              Search now
              <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </div>
          </div>
        </Link>

        {/* Attest Card */}
        <Link
          href="/attest"
          className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group flex flex-col h-full"
        >
          <div className="flex flex-col items-center flex-grow">
            <div className="h-14 w-14 text-indigo-600 mb-5 p-3 bg-indigo-50 rounded-full">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-indigo-600">
              Create Attestations
            </h3>
            <p className="text-gray-600 mb-4 flex-grow">
              Contribute to the ecosystem by creating attestations for contracts you know about.
            </p>
            <div className="mt-auto flex items-center text-indigo-600 text-sm font-medium">
              Start attesting
              <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </div>
          </div>
        </Link>

        {/* Analytics Card */}
        <Link
          href="/analytics"
          className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group flex flex-col h-full"
        >
          <div className="flex flex-col items-center flex-grow">
            <div className="h-14 w-14 text-indigo-600 mb-5 p-3 bg-indigo-50 rounded-full">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-indigo-600">
              Analytics
            </h3>
            <p className="text-gray-600 mb-4 flex-grow">
              View statistics and leaderboards of attestors and explore trending labels.
            </p>
            <div className="mt-auto flex items-center text-indigo-600 text-sm font-medium">
              View analytics
              <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </div>
          </div>
        </Link>
      </div>
  </div>
</div>


{/* Products Built Using OLI Section - Improved Styling */}
<div className="bg-gray-50 py-16">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="text-center mb-12">
      <h2 className="text-3xl font-extrabold text-gray-900">
        Products Using OLI
      </h2>
      <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
        Discover projects leveraging the Label Pool
      </p>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8" style={{ gridAutoRows: '1fr' }}>
      {/* Display products from local configuration */}
      {PRODUCTS_USING_OLI.map((product, index) => {
        const hasImage = !!product.image;
        const gradientColor = product.color || DEFAULT_PRODUCT_COLOR;
        
        return (
          <a 
            key={index}
            href={product.url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group flex flex-col h-full"
          >
            {hasImage ? (
              // Show image if available
              <div className="relative h-48 w-full overflow-hidden">
                <Image 
                  src={product.image!} 
                  alt={`${product.name} screenshot`}
                  width={400}
                  height={320}
                  className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                />
              </div>
            ) : (
              // Use gradient background when no image is available
              <div className={`h-48 bg-gradient-to-br ${gradientColor} relative overflow-hidden group-hover:bg-opacity-90 transition-all duration-300`}>
                <div className="absolute inset-0 flex items-center justify-center">
                  {/* Decorative circles in background */}
                  <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-white opacity-10 transform group-hover:scale-110 transition-transform duration-500"></div>
                  <div className="absolute -bottom-12 -left-12 w-32 h-32 rounded-full bg-white opacity-10 transform group-hover:scale-110 transition-transform duration-500"></div>
                  
                  <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 transform hover:scale-105 transition-all duration-300 z-10">
                    <div className="text-white text-center">
                      <div className="text-2xl font-bold mb-1">{product.name.split(' ')[0]}</div>
                      <div className="text-sm">Visit website</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="p-6 flex-grow flex flex-col">
              <h3 className="text-xl font-semibold text-gray-900 mb-1 flex-grow">{product.name}</h3>
              {product.description && (
                <p className="text-sm text-gray-600 mb-2">{product.description}</p>
              )}
              <div className="flex items-center text-indigo-600 text-sm font-medium mt-auto">
                Visit project
                <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
            </div>
          </a>
        );
      })}
    </div>
    
    {/* Add Your Project Button - Outside grid */}
    <div className="flex justify-center mt-6">
      <a 
        href="mailto:ahoura@openlabelsinitiative.org?subject=Add My Project to OLI" 
        target="_blank" 
        rel="noopener noreferrer" 
        className="inline-flex items-center px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors duration-200"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4 mr-1">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Add Your Project
      </a>
    </div>
  </div>
</div>

      {/* Supporters Section */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-center text-gray-900 mb-12">
            Supported By
          </h2>
          <div className="grid grid-cols-2 gap-8 md:grid-cols-2">
            <div className="col-span-1 flex flex-col items-center">
              <p className="text-gray-600 mb-2 mr-4">Grant from</p>
              <Image
                src="/EF-ESP-logo.svg"
                alt="Ethereum Support Program"
                width={240}
                height={120}
                className="object-contain cursor-pointer hover:opacity-90 transition-opacity duration-200"
                onClick={() => window.open('https://esp.ethereum.foundation/', '_blank')}
              />
            </div>
            <div className="col-span-1 flex justify-center">
                <Image
                    src="/growthepie-logo-dot-com.svg"
                    alt="growthepie"
                    width={240}
                    height={120}
                    className="object-contain cursor-pointer hover:opacity-90 transition-opacity duration-200"
                    onClick={() => window.open('https://growthepie.com/', '_blank')}
                />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
