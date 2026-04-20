"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	ArrowRight,
	Wallet,
	PieChart,
	Target,
	Repeat,
	Tags,
	Bell,
	Download,
	Shield,
	CreditCard,
	TrendingUp,
	Calendar,
	BarChart3,
	Receipt,
	Zap,
	Lock,
	Cloud,
	Smartphone,
	Globe,
	Users,
	Award,
	CheckCircle2,
	Star,
	Mail,
	MessageCircle,
	HelpCircle,
	FileText,
	Rocket,
	Sparkles,
	ChevronRight,
	Menu,
} from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import SpotlightCard from "@/components/ui/spotlight-card";

const HomePage = () => {
	const features = [
		{
			icon: Wallet,
			title: "Multi-Account Management",
			description:
				"Track all your accounts in one place - Cash, Bank Accounts, Credit Cards, and Digital Wallets with real-time balance updates.",
			tags: ["Cash", "Bank", "Credit Card", "Digital Wallet"],
			color: "text-blue-500",
		},
		{
			icon: Tags,
			title: "Smart Categories & Tags",
			description:
				"Organize transactions with customizable categories and tags. Create your own system or use intelligent defaults.",
			tags: ["Custom Categories", "Color Coding", "Smart Tags"],
			color: "text-purple-500",
		},
		{
			icon: Repeat,
			title: "Recurring Transactions",
			description:
				"Set up recurring income and expenses - daily, weekly, monthly, or yearly. Never miss tracking regular payments.",
			tags: ["Daily", "Weekly", "Monthly", "Yearly"],
			color: "text-green-500",
		},
		{
			icon: Target,
			title: "Budget Planning",
			description:
				"Create budgets for categories and track spending in real-time. Get alerts when you're approaching limits.",
			tags: ["Monthly Budgets", "Spending Limits", "Smart Alerts"],
			color: "text-orange-500",
		},
		{
			icon: TrendingUp,
			title: "Savings Goals",
			description:
				"Set financial goals and track your progress. Visual milestones keep you motivated on your savings journey.",
			tags: ["Goal Tracking", "Progress Visualization", "Milestones"],
			color: "text-emerald-500",
		},
		{
			icon: BarChart3,
			title: "Advanced Analytics",
			description:
				"Deep insights into your spending patterns with beautiful charts and detailed reports. Understand where your money goes.",
			tags: ["Spending Trends", "Category Breakdown", "Cash Flow"],
			color: "text-pink-500",
		},
	];

	const stats = [
		{ value: "10K+", label: "Active Users", icon: Users },
		{ value: "$50M+", label: "Transactions Tracked", icon: Receipt },
		{ value: "99.9%", label: "Uptime", icon: Cloud },
		{ value: "150+", label: "Countries", icon: Globe },
	];

	const pricingPlans = [
		{
			name: "Free",
			price: "$0",
			period: "forever",
			icon: Zap,
			features: [
				"Unlimited transactions",
				"Up to 5 accounts",
				"Basic categories & tags",
				"Monthly reports",
				"Export to CSV",
			],
			cta: "Get Started",
			popular: false,
		},
		{
			name: "Pro",
			price: "$4.99",
			period: "per month",
			icon: Award,
			features: [
				"Everything in Free",
				"Unlimited accounts",
				"Custom categories",
				"Budget planning",
				"Recurring transactions",
				"Advanced analytics",
				"Priority support",
			],
			cta: "Start Free Trial",
			popular: true,
		},
		{
			name: "Team",
			price: "$12.99",
			period: "per month",
			icon: Users,
			features: [
				"Everything in Pro",
				"Multi-user support",
				"Shared accounts",
				"Team budgets",
				"Audit logs",
				"API access",
				"24/7 priority support",
			],
			cta: "Contact Sales",
			popular: false,
		},
	];

	const exportFormats = [
		{ name: "CSV", icon: FileText },
		{ name: "Excel", icon: FileText },
		{ name: "PDF Reports", icon: FileText },
		{ name: "JSON", icon: FileText },
		{ name: "Google Sheets", icon: Cloud },
		{ name: "QuickBooks", icon: Receipt },
	];

	const securityFeatures = [
		{
			icon: Lock,
			title: "End-to-End Encryption",
			description:
				"Your financial data is encrypted at rest and in transit using AES-256 encryption.",
		},
		{
			icon: Shield,
			title: "Two-Factor Authentication",
			description:
				"Extra layer of security with TOTP and SMS verification options.",
		},
		{
			icon: Cloud,
			title: "Automatic Backups",
			description:
				"Your data is backed up daily and securely stored with point-in-time recovery.",
		},
	];

	const testimonials = [
		{
			name: "Sarah Johnson",
			role: "Freelance Designer",
			content:
				"This expense tracker transformed how I manage my business finances. The multi-account feature is a game-changer!",
			avatar: "SJ",
			icon: Star,
		},
		{
			name: "Michael Chen",
			role: "Small Business Owner",
			content:
				"Finally, a budgeting tool that actually makes sense. The analytics helped me cut unnecessary expenses by 30%.",
			avatar: "MC",
			icon: Star,
		},
		{
			name: "Emily Rodriguez",
			role: "Digital Nomad",
			content:
				"Perfect for tracking expenses across multiple currencies. The mobile experience is seamless and intuitive.",
			avatar: "ER",
			icon: Star,
		},
	];

	const footerLinks = {
		product: [
			{ name: "Features", href: "#features", icon: Sparkles },
			{ name: "Pricing", href: "#pricing", icon: CreditCard },
			{ name: "Security", href: "#security", icon: Shield },
			{ name: "API", href: "#", icon: Zap },
		],
		resources: [
			{ name: "Documentation", href: "#", icon: FileText },
			{ name: "Guides", href: "#", icon: HelpCircle },
			{ name: "Blog", href: "#", icon: MessageCircle },
			{ name: "Changelog", href: "#", icon: Calendar },
		],
		company: [
			{ name: "About", href: "#", icon: Users },
			{ name: "Careers", href: "#", icon: Award },
			{ name: "Contact", href: "#", icon: Mail },
			{ name: "Privacy", href: "#", icon: Lock },
		],
	};

	return (
		<ScrollArea className="h-screen w-full">
			<div className="min-h-screen bg-background">
				{/* Navigation */}
				<nav className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
					<div className="container mx-auto px-4 py-3 flex items-center justify-between">
						<div className="flex items-center gap-2">
							<Wallet className="h-6 w-6 text-primary" />
							<span className="font-bold text-xl">
								ExpenseTracker
							</span>
						</div>

						<div className="hidden md:flex items-center gap-6">
							<Link
								href="#features"
								className="text-sm hover:text-primary transition flex items-center gap-1"
							>
								<Sparkles className="h-4 w-4" />
								Features
							</Link>
							<Link
								href="#pricing"
								className="text-sm hover:text-primary transition flex items-center gap-1"
							>
								<CreditCard className="h-4 w-4" />
								Pricing
							</Link>
							<Link
								href="#security"
								className="text-sm hover:text-primary transition flex items-center gap-1"
							>
								<Shield className="h-4 w-4" />
								Security
							</Link>
							<Link
								href="#"
								className="text-sm hover:text-primary transition flex items-center gap-1"
							>
								<FileText className="h-4 w-4" />
								Docs
							</Link>
						</div>

						<div className="flex items-center gap-2">
							<ThemeToggle />
							<Button
								variant="ghost"
								size="sm"
								className="hidden sm:inline-flex"
							>
								Sign In
							</Button>
							<Button size="sm">
								<Rocket className="h-4 w-4 mr-2" />
								Get Started
							</Button>
						</div>
					</div>
				</nav>

				{/* Hero Section */}
				<section className="container mx-auto px-4 py-16 md:py-24 text-center">
					<Badge variant="outline" className="mb-4">
						<Sparkles className="h-3 w-3 mr-2" />
						Take Control of Your Finances
					</Badge>
					<h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent max-w-4xl mx-auto">
						Track Every Expense, Reach Every Financial Goal
					</h1>
					<p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
						The most intuitive expense tracker with powerful
						analytics, budgeting tools, and multi-account support.
						Join thousands who've taken control of their finances.
					</p>
					<div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
						<Button size="lg" className="gap-2">
							<Rocket className="h-5 w-5" />
							Start Tracking Free
							<ArrowRight className="h-4 w-4" />
						</Button>
					</div>

					{/* Trust Indicators */}
					<div className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
						<div className="flex items-center gap-2">
							<Shield className="h-4 w-4" />
							Bank-level Security
						</div>
						<div className="flex items-center gap-2">
							<Smartphone className="h-4 w-4" />
							Mobile Friendly
						</div>
						<div className="flex items-center gap-2">
							<Download className="h-4 w-4" />
							Export Anywhere
						</div>
						<div className="flex items-center gap-2">
							<Users className="h-4 w-4" />
							10,000+ Users
						</div>
					</div>
				</section>

				{/* Features Grid */}
				<section
					id="features"
					className="container mx-auto px-4 py-16 md:py-20"
				>
					<div className="text-center mb-12">
						<Badge variant="outline" className="mb-4">
							<Zap className="h-3 w-3 mr-2" />
							Powerful Features
						</Badge>
						<h2 className="text-3xl md:text-4xl font-bold mb-4">
							Everything You Need to Master Your Money
						</h2>
						<p className="text-muted-foreground max-w-2xl mx-auto">
							Comprehensive tools designed to give you complete
							control over your personal and business finances.
						</p>
					</div>

					<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
						{features.map((feature) => {
							const IconComponent = feature.icon;
							return (
								<SpotlightCard
									key={feature.title}
									className="p-6"
								>
									<IconComponent
										className={`h-10 w-10 ${feature.color} mb-4`}
									/>
									<h3 className="text-xl font-semibold mb-2">
										{feature.title}
									</h3>
									<p className="text-muted-foreground mb-4">
										{feature.description}
									</p>
									<div className="flex flex-wrap gap-2">
										{feature.tags.map((tag) => (
											<Badge
												key={tag}
												variant="secondary"
											>
												{tag}
											</Badge>
										))}
									</div>
								</SpotlightCard>
							);
						})}
					</div>
				</section>

				{/* Stats Section */}
				<section className="bg-primary/5 border-y py-16">
					<div className="container mx-auto px-4">
						<div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
							{stats.map((stat) => {
								const IconComponent = stat.icon;
								return (
									<div key={stat.label}>
										<IconComponent className="h-8 w-8 mx-auto mb-3 text-primary" />
										<div className="text-3xl md:text-4xl font-bold mb-2">
											{stat.value}
										</div>
										<div className="text-muted-foreground text-sm">
											{stat.label}
										</div>
									</div>
								);
							})}
						</div>
					</div>
				</section>

				{/* How It Works */}
				<section className="container mx-auto px-4 py-16 md:py-20">
					<div className="text-center mb-12">
						<Badge variant="outline" className="mb-4">
							<Rocket className="h-3 w-3 mr-2" />
							Get Started in Minutes
						</Badge>
						<h2 className="text-3xl md:text-4xl font-bold mb-4">
							Simple Yet Powerful
						</h2>
						<p className="text-muted-foreground max-w-2xl mx-auto">
							Three simple steps to take control of your financial
							life
						</p>
					</div>

					<div className="grid md:grid-cols-3 gap-8">
						<div className="text-center">
							<div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
								<Wallet className="h-8 w-8 text-primary" />
							</div>
							<h3 className="text-lg font-semibold mb-2">
								1. Connect Your Accounts
							</h3>
							<p className="text-muted-foreground text-sm">
								Add your bank accounts, credit cards, and
								digital wallets in seconds
							</p>
						</div>
						<div className="text-center">
							<div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
								<Tags className="h-8 w-8 text-primary" />
							</div>
							<h3 className="text-lg font-semibold mb-2">
								2. Track & Categorize
							</h3>
							<p className="text-muted-foreground text-sm">
								Automatically categorize transactions and add
								custom tags
							</p>
						</div>
						<div className="text-center">
							<div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
								<BarChart3 className="h-8 w-8 text-primary" />
							</div>
							<h3 className="text-lg font-semibold mb-2">
								3. Analyze & Grow
							</h3>
							<p className="text-muted-foreground text-sm">
								Get insights, set budgets, and achieve your
								financial goals
							</p>
						</div>
					</div>
				</section>

				{/* Pricing Section */}
				{/* <section id="pricing" className="bg-muted/30 py-16 md:py-20">
					<div className="container mx-auto px-4">
						<div className="text-center mb-12">
							<Badge variant="outline" className="mb-4">
								<CreditCard className="h-3 w-3 mr-2" />
								Simple Pricing
							</Badge>
							<h2 className="text-3xl md:text-4xl font-bold mb-4">
								Choose the Perfect Plan
							</h2>
							<p className="text-muted-foreground max-w-2xl mx-auto">
								Start free and upgrade anytime. No hidden fees,
								cancel anytime.
							</p>
						</div>

						<div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
							{pricingPlans.map((plan) => {
								const IconComponent = plan.icon;
								return (
									<SpotlightCard
										key={plan.name}
										className={`p-6 relative ${
											plan.popular
												? "border-primary border-2"
												: ""
										}`}
									>
										{plan.popular && (
											<Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
												<Star className="h-3 w-3 mr-1" />
												Most Popular
											</Badge>
										)}
										<div className="text-center mb-6">
											<IconComponent className="h-8 w-8 mx-auto mb-3 text-primary" />
											<h3 className="text-xl font-bold mb-2">
												{plan.name}
											</h3>
											<div className="text-3xl font-bold mb-1">
												{plan.price}
											</div>
											<div className="text-sm text-muted-foreground">
												{plan.period}
											</div>
										</div>
										<ul className="space-y-3 mb-6">
											{plan.features.map((feature) => (
												<li
													key={feature}
													className="flex items-start gap-2 text-sm"
												>
													<CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
													<span>{feature}</span>
												</li>
											))}
										</ul>
										<Button
											className="w-full"
											variant={
												plan.popular
													? "default"
													: "outline"
											}
										>
											{plan.cta}
											<ChevronRight className="h-4 w-4 ml-2" />
										</Button>
									</SpotlightCard>
								);
							})}
						</div>
					</div>
				</section> */}

				{/* Export Formats */}
				<section className="container mx-auto px-4 py-16 md:py-20">
					<div className="grid lg:grid-cols-2 gap-12 items-center">
						<div>
							<Badge variant="outline" className="mb-4">
								<Download className="h-3 w-3 mr-2" />
								Export & Integration
							</Badge>
							<h2 className="text-3xl font-bold mb-4">
								Your Data, Your Way
							</h2>
							<p className="text-muted-foreground mb-6">
								Export your financial data in multiple formats
								or integrate with your favorite tools. Complete
								control over your information.
							</p>
							<div className="grid grid-cols-2 gap-3 mb-8">
								{exportFormats.map((format) => {
									const IconComponent = format.icon;
									return (
										<div
											key={format.name}
											className="flex items-center gap-2 p-3 border rounded-lg"
										>
											<IconComponent className="h-4 w-4 text-primary" />
											<span className="text-sm font-medium">
												{format.name}
											</span>
										</div>
									);
								})}
							</div>
							<Button className="gap-2">
								<FileText className="h-4 w-4" />
								Learn About Integrations
								<ArrowRight className="h-4 w-4" />
							</Button>
						</div>
						<SpotlightCard className="p-6 bg-muted/30">
							<pre className="text-sm overflow-x-auto">
								<code className="language-json">
									{`{
  "transaction": {
    "id": "txn_abc123",
    "amount": 45.99,
    "type": "EXPENSE",
    "category": "Food & Dining",
    "account": "Chase Checking",
    "date": "2026-04-20T10:30:00Z",
    "tags": ["lunch", "business"]
  }
}`}
								</code>
							</pre>
						</SpotlightCard>
					</div>
				</section>

				{/* Security Section */}
				<section id="security" className="bg-muted/30 py-16 md:py-20">
					<div className="container mx-auto px-4">
						<div className="text-center mb-12">
							<Badge variant="outline" className="mb-4">
								<Shield className="h-3 w-3 mr-2" />
								Enterprise-Grade Security
							</Badge>
							<h2 className="text-3xl md:text-4xl font-bold mb-4">
								Your Data is Safe With Us
							</h2>
							<p className="text-muted-foreground max-w-2xl mx-auto">
								We use industry-leading security measures to
								protect your financial information.
							</p>
						</div>

						<div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
							{securityFeatures.map((feature) => {
								const IconComponent = feature.icon;
								return (
									<SpotlightCard
										key={feature.title}
										className="p-6 text-center"
									>
										<IconComponent className="h-12 w-12 mx-auto mb-4 text-primary" />
										<h3 className="text-lg font-semibold mb-2">
											{feature.title}
										</h3>
										<p className="text-sm text-muted-foreground">
											{feature.description}
										</p>
									</SpotlightCard>
								);
							})}
						</div>
					</div>
				</section>

				{/* Testimonials */}
				<section className="container mx-auto px-4 py-16 md:py-20">
					<div className="text-center mb-12">
						<Badge variant="outline" className="mb-4">
							<Users className="h-3 w-3 mr-2" />
							Loved by Thousands
						</Badge>
						<h2 className="text-3xl md:text-4xl font-bold mb-4">
							What Our Users Say
						</h2>
						<p className="text-muted-foreground max-w-2xl mx-auto">
							Join thousands of satisfied users who've transformed
							their financial habits.
						</p>
					</div>

					<div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
						{testimonials.map((testimonial) => {
							const IconComponent = testimonial.icon;
							return (
								<SpotlightCard
									key={testimonial.name}
									className="p-6"
								>
									<div className="flex gap-1 mb-3">
										{[...Array(5)].map((_, i) => (
											<IconComponent
												key={i}
												className="h-4 w-4 fill-yellow-500 text-yellow-500"
											/>
										))}
									</div>
									<p className="text-muted-foreground mb-4">
										"{testimonial.content}"
									</p>
									<div className="flex items-center gap-3">
										<div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
											{testimonial.avatar}
										</div>
										<div>
											<div className="font-semibold">
												{testimonial.name}
											</div>
											<div className="text-sm text-muted-foreground">
												{testimonial.role}
											</div>
										</div>
									</div>
								</SpotlightCard>
							);
						})}
					</div>
				</section>

				{/* CTA Section */}
				{/* <section className="container mx-auto px-4 py-16 md:py-20 text-center">
					<SpotlightCard className="p-8 md:p-12 bg-gradient-to-br from-primary/10 via-background to-background border-2">
						<Rocket className="h-12 w-12 mx-auto mb-6 text-primary" />
						<h2 className="text-2xl md:text-3xl font-bold mb-4">
							Ready to Take Control of Your Finances?
						</h2>
						<p className="text-muted-foreground mb-8 max-w-xl mx-auto">
							Join thousands of users who've already transformed
							their financial habits. Start your journey today -
							it's free!
						</p>
						<div className="flex flex-col sm:flex-row gap-4 justify-center">
							<Button size="lg" className="gap-2">
								<Rocket className="h-5 w-5" />
								Start Free Trial
								<ArrowRight className="h-4 w-4" />
							</Button>
							<Button
								size="lg"
								variant="outline"
								className="gap-2"
							>
								<Calendar className="h-5 w-5" />
								Schedule Demo
							</Button>
						</div>
						<p className="text-xs text-muted-foreground mt-4">
							No credit card required • Free forever plan
							available
						</p>
					</SpotlightCard>
				</section> */}

				{/* Footer */}
				{/* Footer */}
				<footer className="border-t py-12">
					<div className="container mx-auto px-4">
						<div className="grid grid-cols-2 md:grid-cols-4 gap-8">
							<div className="col-span-2 md:col-span-1">
								<div className="flex items-center gap-2 mb-4">
									<Wallet className="h-5 w-5 text-primary" />
									<span className="font-bold">
										ExpenseTracker
									</span>
								</div>
								<p className="text-sm text-muted-foreground mb-4">
									Take control of your finances with our
									powerful, intuitive expense tracking
									solution.
								</p>
								<div className="flex gap-3">
									<Link
										href="#"
										className="text-muted-foreground hover:text-primary transition"
									>
										<MessageCircle className="h-5 w-5" />
									</Link>
									<Link
										href="#"
										className="text-muted-foreground hover:text-primary transition"
									>
										<Mail className="h-5 w-5" />
									</Link>
									<Link
										href="#"
										className="text-muted-foreground hover:text-primary transition"
									>
										<HelpCircle className="h-5 w-5" />
									</Link>
								</div>
							</div>

							{Object.entries(footerLinks).map(
								([category, links]) => (
									<div key={category}>
										<h4 className="font-semibold mb-4 capitalize">
											{category}
										</h4>
										<ul className="space-y-2">
											{links.map((link) => {
												const IconComponent = link.icon;
												return (
													<li key={link.name}>
														<Link
															href={link.href}
															className="text-sm text-muted-foreground hover:text-primary transition flex items-center gap-2"
														>
															<IconComponent className="h-3 w-3" />
															{link.name}
														</Link>
													</li>
												);
											})}
										</ul>
									</div>
								),
							)}
						</div>

						<div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
							<p>
								© 2026 ExpenseTracker. All rights reserved. Made
								with <span className="text-red-500">❤️</span>{" "}
								for better financial health.
							</p>
						</div>
					</div>
				</footer>
			</div>
		</ScrollArea>
	);
};

export default HomePage;
