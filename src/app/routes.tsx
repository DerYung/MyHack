import { createBrowserRouter } from "react-router";
import { DashboardRouter } from "./pages/DashboardRouter";
import { SubmitStartup } from "./pages/SubmitStartup";
import { MentorMatching } from "./pages/MentorMatching";
import { InvestorBrief } from "./pages/InvestorBrief";
import { FunderMatching } from "./pages/FunderMatching";
import { CoInvestment } from "./pages/CoInvestment";
import { AdminDashboard } from "./pages/AdminDashboard";
import { NotFound } from "./pages/NotFound";
import { AuthPage } from "./pages/AuthPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { LandingPage } from "./pages/LandingPage";

import { Layout } from "./components/Layout";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LandingPage,
  },
  {
    path: "/login",
    Component: AuthPage,
  },
  {
    path: "/onboarding",
    Component: OnboardingPage,
  },
  {
    Component: Layout,
    children: [
      {
        path: "/dashboard",
        Component: DashboardRouter,
      },
      {
        path: "/submit-startup",
        Component: SubmitStartup,
      },
      {
        path: "/mentor-matching",
        Component: MentorMatching,
      },
      {
        path: "/investor-brief/:startupId",
        Component: InvestorBrief,
      },
      {
        path: "/funder-matching",
        Component: FunderMatching,
      },
      {
        path: "/co-investment/:startupId",
        Component: CoInvestment,
      },
      {
        path: "/admin",
        Component: AdminDashboard,
      },
      {
        path: "*",
        Component: NotFound,
      },
    ],
  },
]);
