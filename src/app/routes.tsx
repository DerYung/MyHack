import { createBrowserRouter } from "react-router";
import { LandingPage } from "./pages/LandingPage";
import { Dashboard } from "./pages/Dashboard";
import { SubmitStartup } from "./pages/SubmitStartup";
import { MentorMatching } from "./pages/MentorMatching";
import { InvestorBrief } from "./pages/InvestorBrief";
import { FunderMatching } from "./pages/FunderMatching";
import { CoInvestment } from "./pages/CoInvestment";
import { NotFound } from "./pages/NotFound";
import { AuthPage } from "./pages/AuthPage";
import { OnboardingPage } from "./pages/OnboardingPage";

import { Layout } from "./components/Layout";

export const router = createBrowserRouter([
  {
    Component: Layout,
    children: [
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
        path: "/dashboard",
        Component: Dashboard,
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
        path: "*",
        Component: NotFound,
      },
    ],
  },
]);
