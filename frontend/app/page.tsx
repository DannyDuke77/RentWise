'use client';

import { useState } from 'react';
import { 
  CheckCircle, 
  Shield, 
  Zap, 
  BarChart, 
  Users, 
  DollarSign,
  ArrowRight,
  Building,
  Smartphone,
  Globe,
  Award,
  Star,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import Link from 'next/link';
import CustomButton from '@/app/components/ui/CustomButton';
import Image from 'next/image';

const HomePage = () => {

  const features = [
    {
      icon: BarChart,
      title: 'Real-Time Analytics',
      description: 'Monitor property performance, occupancy rates, and financial metrics with live dashboards.'
    },
    {
      icon: DollarSign,
      title: 'Automated Rent Collection',
      description: 'Streamline payment processing with automated reminders and multiple payment options.'
    },
    {
      icon: Users,
      title: 'Tenant Management',
      description: 'Manage tenant information, lease agreements, and communication all in one place.'
    },
    {
      icon: Shield,
      title: 'Secure & Compliant',
      description: 'Bank-level security and compliance with all housing regulations and data protection laws.'
    },
    {
      icon: Zap,
      title: 'Maintenance Tracking',
      description: 'Easily manage and track maintenance requests from submission to completion.'
    },
    {
      icon: Building,
      title: 'Property Portfolio',
      description: 'Get a comprehensive view of all your properties with detailed insights and analytics.'
    }
  ];

  const testimonials = [
    {
      name: 'Michael Rodriguez',
      role: 'Property Owner, 12+ units',
      content: 'RentWise cut my administrative time by 70%. The automated systems are a game-changer.',
      rating: 5,
      avatar: 'MR'
    },
    {
      name: 'Sarah Johnson',
      role: 'Real Estate Investor',
      content: 'The analytics dashboard helped me identify underperforming properties and increase my ROI by 30%.',
      rating: 5,
      avatar: 'SJ'
    },
    {
      name: 'David Chen',
      role: 'Property Manager',
      content: 'Tenant satisfaction has never been higher. The maintenance tracking system is incredibly efficient.',
      rating: 5,
      avatar: 'DC'
    }
  ];

  const stats = [
    { label: 'Properties Managed', value: '10,000+' },
    { label: 'Happy Landlords', value: '5,000+' },
    { label: 'Monthly Rent Processed', value: '$50M+' },
    { label: 'System Uptime', value: '99.9%' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6">
              <span className="block bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                RentWise
              </span>
              <span className="block bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Property Management
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-10">
              Streamline your rental property operations with our all-in-one platform. 
              From tenant screening to automated payments, we've got you covered.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link href="/auth/register">
                <CustomButton 
                  label="Start Free Trial"
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold rounded-xl text-lg shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300"
                />
              </Link>
              <Link href="#demo">
                <CustomButton 
                  label="Watch Demo"
                  className="px-8 py-4 bg-gray-800 border border-gray-700 hover:bg-gray-700 text-white font-semibold rounded-xl text-lg transition-all duration-300"
                />
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-white mb-2">{stat.value}</div>
                  <div className="text-gray-400 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Everything You Need in One Platform
            </h2>
            <p className="text-gray-400 text-lg max-w-3xl mx-auto">
              Manage your entire property portfolio with our comprehensive suite of tools
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={index}
                  className="group p-8 bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/50 hover:border-blue-500/50 transition-all duration-300 hover:scale-[1.02]"
                >
                  <div className="p-3 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl w-fit mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Trusted by Property Owners
            </h2>
            <p className="text-gray-400 text-lg">Join thousands of satisfied landlords and property managers</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index}
                className="p-8 bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/50"
              >
                <div className="flex items-center gap-2 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                
                <p className="text-gray-300 mb-6 italic">"{testimonial.content}"</p>
                
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-white">{testimonial.name}</div>
                    <div className="text-sm text-gray-400">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-gray-900 via-blue-900/20 to-cyan-900/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 rounded-full mb-6">
            <Award className="w-4 h-4 text-blue-400" />
            <span className="text-blue-400 text-sm font-medium">Start Your Free Trial Today</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Property Management?
          </h2>
          
          <p className="text-gray-400 text-lg mb-10 max-w-2xl mx-auto">
            Join thousands of property owners who have simplified their operations with RentWise. 
            No credit card required for the 14-day free trial.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <CustomButton 
                label="Get Started Free"
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold rounded-xl text-lg shadow-2xl shadow-blue-500/30"
              />
            </Link>
            <Link href="/contact">
              <CustomButton 
                label="Schedule a Demo"
                className="px-8 py-4 bg-gray-800 border border-gray-700 hover:bg-gray-700 text-white font-semibold rounded-xl text-lg"
              />
            </Link>
          </div>
          
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Image
                  src="/rentwise_logo.jpeg"
                  alt="RentWise Logo"
                  width={32}
                  height={32}
                  className="rounded-lg"
                  unoptimized
                />
                <span className="text-lg font-bold text-white">RentWise</span>
              </div>
              <p className="text-gray-400 text-sm mb-6">
                Modern property management software for landlords and property managers.
              </p>
              <div className="flex items-center gap-4">
                <Globe className="w-5 h-5 text-gray-500" />
                <Smartphone className="w-5 h-5 text-gray-500" />
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li><Link href="#features" className="text-gray-400 hover:text-white text-sm">Features</Link></li>
                <li><Link href="#pricing" className="text-gray-400 hover:text-white text-sm">Pricing</Link></li>
                <li><Link href="/demo" className="text-gray-400 hover:text-white text-sm">Demo</Link></li>
                <li><Link href="/updates" className="text-gray-400 hover:text-white text-sm">Updates</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><Link href="/about" className="text-gray-400 hover:text-white text-sm">About Us</Link></li>
                <li><Link href="/careers" className="text-gray-400 hover:text-white text-sm">Careers</Link></li>
                <li><Link href="/blog" className="text-gray-400 hover:text-white text-sm">Blog</Link></li>
                <li><Link href="/contact" className="text-gray-400 hover:text-white text-sm">Contact</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-white font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><Link href="/privacy" className="text-gray-400 hover:text-white text-sm">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-gray-400 hover:text-white text-sm">Terms of Service</Link></li>
                <li><Link href="/security" className="text-gray-400 hover:text-white text-sm">Security</Link></li>
                <li><Link href="/compliance" className="text-gray-400 hover:text-white text-sm">Compliance</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm">
              © 2024 RentWise. All rights reserved.
            </p>
            <div className="flex items-center gap-6 mt-4 md:mt-0">
              <Link href="/twitter" className="text-gray-500 hover:text-white text-sm">
                Twitter
              </Link>
              <Link href="/linkedin" className="text-gray-500 hover:text-white text-sm">
                LinkedIn
              </Link>
              <Link href="/facebook" className="text-gray-500 hover:text-white text-sm">
                Facebook
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;