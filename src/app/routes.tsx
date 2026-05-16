import { createBrowserRouter } from "react-router";
import { LandingPage } from "./pages/LandingPage";
import { Dashboard } from "./pages/Dashboard";
import { SubmitStartup } from "./pages/SubmitStartup";
import { MentorMatching } from "./pages/MentorMatching";
import { InvestorBrief } from "./pages/InvestorBrief";
import { FunderMatching } from "./pages/FunderMatching";
import { CoInvestment } from "./pages/CoInvestment";
import { NotFound } from "./pages/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LandingPage,
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
]);
