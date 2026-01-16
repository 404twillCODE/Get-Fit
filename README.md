# Get Fit 💪

A modern, full-featured fitness and wellness tracking application built with Next.js. Track your calories, workouts, weight, and progress all in one beautiful, intuitive interface.

![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?style=flat-square&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Enabled-green?style=flat-square&logo=supabase)

## ✨ Features

### 📊 **Calorie & Deficit Tracking**
- Track daily calories consumed and burned
- Monitor macronutrients (fat, carbs, protein)
- Calculate and visualize calorie deficit
- View weekly, monthly, and yearly statistics
- Historical data tracking with date-based entries

### 🏋️ **Workout Management**
- Create and save custom workout routines
- Track strength training with sets, reps, and weight
- Log cardio exercises with duration, distance, and calories
- Weekly workout schedule planning
- Workout history tracking
- Exercise library with equipment tracking

### 📈 **Weight Tracking**
- Daily weight logging with date selection
- Weight change visualization
- Historical weight data
- Weekly weight reminders
- Progress tracking over time

### 📱 **User Experience**
- **PWA Support** - Install as a mobile app
- **Dark Mode** - Beautiful dark theme optimized for all devices
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- **Guest Mode** - Try the app without creating an account
- **Cloud Sync** - Your data syncs across all devices with Supabase

### 🔐 **Authentication & Data**
- Secure authentication with Supabase
- Email/password and OTP (One-Time Password) login
- Guest mode for local-only usage
- Automatic data synchronization
- Profile setup with fitness goals and activity levels

### 📊 **Insights & Analytics**
- Dashboard with today's overview
- Weekly workout completion tracking
- Calorie deficit streaks
- Historical data visualization
- Export and copy data functionality

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account (for cloud sync) - [Get one free](https://supabase.com)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/Get-Fit.git
   cd Get-Fit
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
   
   Get these values from your [Supabase Dashboard](https://app.supabase.com/project/_/settings/api)

4. **Set up Supabase Database**
   
   See the [Supabase Setup Guide](./docs/supabase-setup.md) for detailed instructions on:
   - Creating the required database table
   - Setting up Row Level Security (RLS) policies
   - Configuring authentication

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 Documentation

- [Supabase Setup Guide](./docs/supabase-setup.md) - Complete database and authentication setup
- [GitHub Pages Deployment](./docs/github-pages-setup.md) - Deploy to GitHub Pages

## 🛠️ Tech Stack

- **Framework:** [Next.js 14](https://nextjs.org/) with App Router
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **Backend:** [Supabase](https://supabase.com) (PostgreSQL + Auth)
- **Deployment:** Static export support for GitHub Pages

## 📦 Project Structure

```
Get-Fit/
├── app/                    # Next.js app router pages
│   ├── calories/          # Calorie tracking page
│   ├── workouts/          # Workout tracking page
│   └── insights/          # Analytics and insights page
├── components/            # React components
│   ├── Dashboard.tsx      # Main dashboard
│   ├── DeficitCalculator.tsx
│   ├── WorkoutTracker.tsx
│   ├── WeightTracker.tsx
│   └── ...
├── lib/                   # Utility functions
│   ├── dataStore.ts      # Supabase data operations
│   ├── storage.ts         # Local storage utilities
│   └── supabaseClient.ts  # Supabase client setup
└── docs/                  # Documentation
```

## 🎯 Usage

### First Time Setup

1. **Create an account** or **continue as guest**
2. **Set up your profile** with:
   - Personal information (name, age, height)
   - Current and goal weight
   - Activity level
   - Fitness goals

### Daily Tracking

- **Calories:** Navigate to the Calories page to log your daily nutrition and fitness activities
- **Workouts:** Use the Workouts page to track your exercise routines
- **Weight:** Log your weight from the Insights page

### View Progress

- Check the **Dashboard** for today's summary
- Visit **Insights** for detailed analytics and historical data

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Powered by [Supabase](https://supabase.com)
- Icons and UI inspired by modern fitness apps

---

**Made with ❤️ for your fitness journey**

