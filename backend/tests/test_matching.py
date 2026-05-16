"""
Tests for the matching pipeline — Stage 1 (hard filter) logic.
Can run without any API credentials.
"""

import sys
import os

# Add backend root to path so imports work
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from models.firestore_models import MentorDoc, CompanyDoc, FunderDoc, LinkageDoc
from services.hard_filter import filter_mentors, filter_funders


def make_company(**overrides) -> CompanyDoc:
    """Helper to create a test company."""
    defaults = {
        "uid": "company-1",
        "name": "TestStartup",
        "description": "An AI-powered testing platform",
        "sector": "FinTech",
        "stage": "Seed",
        "region": "Southeast Asia",
        "budget_needed": 200000,
        "budget_breakdown": "Dev: $100k, Marketing: $50k, Ops: $50k",
        "market_goals": "Capture 5% of SEA fintech market",
        "status": "submitted",
    }
    defaults.update(overrides)
    return CompanyDoc(**defaults)


def make_mentor(**overrides) -> MentorDoc:
    """Helper to create a test mentor."""
    defaults = {
        "uid": "mentor-1",
        "name": "Test Mentor",
        "email": "mentor@test.com",
        "industries": ["FinTech", "SaaS"],
        "expertise": ["Product", "GTM"],
        "region": "Southeast Asia",
        "max_capacity": 3,
        "active_count": 0,
        "bio": "Experienced fintech mentor",
        "years_experience": 10,
        "startups_helped": 15,
        "avg_outcome_rating": 4.2,
    }
    defaults.update(overrides)
    return MentorDoc(**defaults)


def make_funder(**overrides) -> FunderDoc:
    """Helper to create a test funder."""
    defaults = {
        "uid": "funder-1",
        "name": "Test Fund",
        "email": "fund@test.com",
        "investment_focus": ["FinTech", "DeepTech"],
        "stage_interest": "Seed",
        "min_investment": 50000,
        "max_investment": 500000,
        "region": "Southeast Asia",
        "bio": "Early stage fintech investor",
        "portfolio": ["CompanyA", "CompanyB"],
        "successful_investments": 25,
    }
    defaults.update(overrides)
    return FunderDoc(**defaults)


# ── Hard Filter Tests ───────────────────────────────────────────────

class TestMentorHardFilter:
    def test_basic_industry_match(self):
        company = make_company(sector="FinTech")
        mentors = [
            make_mentor(uid="m1", industries=["FinTech"]),
            make_mentor(uid="m2", industries=["HealthTech"]),
            make_mentor(uid="m3", industries=["FinTech", "SaaS"]),
        ]
        result = filter_mentors(company, mentors, [])
        uids = [m.uid for m in result]
        assert "m1" in uids, "Mentor with matching industry should pass"
        assert "m2" not in uids, "Mentor without matching industry should be filtered"
        assert "m3" in uids, "Mentor with multiple industries including match should pass"

    def test_capacity_filter(self):
        company = make_company(sector="FinTech")
        mentors = [
            make_mentor(uid="m1", industries=["FinTech"], max_capacity=3, active_count=2),
            make_mentor(uid="m2", industries=["FinTech"], max_capacity=3, active_count=3),
            make_mentor(uid="m3", industries=["FinTech"], max_capacity=5, active_count=5),
        ]
        result = filter_mentors(company, mentors, [])
        uids = [m.uid for m in result]
        assert "m1" in uids, "Mentor with capacity should pass"
        assert "m2" not in uids, "Mentor at max capacity should be filtered"
        assert "m3" not in uids, "Mentor at max capacity should be filtered"

    def test_active_linkage_filter(self):
        company = make_company(uid="c1", sector="FinTech")
        mentors = [
            make_mentor(uid="m1", industries=["FinTech"]),
            make_mentor(uid="m2", industries=["FinTech"]),
        ]
        linkages = [
            LinkageDoc(id="l1", mentor_uid="m1", company_uid="c1", status="active"),
        ]
        result = filter_mentors(company, mentors, linkages)
        uids = [m.uid for m in result]
        assert "m1" not in uids, "Mentor with active linkage to company should be filtered"
        assert "m2" in uids, "Mentor without active linkage should pass"

    def test_completed_linkage_allowed(self):
        company = make_company(uid="c1", sector="FinTech")
        mentors = [make_mentor(uid="m1", industries=["FinTech"])]
        linkages = [
            LinkageDoc(id="l1", mentor_uid="m1", company_uid="c1", status="completed", outcome_rating=4.5),
        ]
        result = filter_mentors(company, mentors, linkages)
        assert len(result) == 1, "Mentor with completed linkage should still be available"

    def test_empty_mentors(self):
        company = make_company(sector="FinTech")
        result = filter_mentors(company, [], [])
        assert result == [], "Empty mentor list should return empty"

    def test_case_insensitive_industry_match(self):
        company = make_company(sector="fintech")
        mentors = [make_mentor(uid="m1", industries=["FinTech"])]
        result = filter_mentors(company, mentors, [])
        assert len(result) == 1, "Industry match should be case-insensitive"

    def test_sorting_by_heuristic(self):
        company = make_company(sector="FinTech", region="Southeast Asia")
        mentors = [
            make_mentor(uid="m1", industries=["FinTech"], years_experience=3, startups_helped=2, region="Europe"),
            make_mentor(uid="m2", industries=["FinTech"], years_experience=15, startups_helped=30, region="Southeast Asia"),
        ]
        result = filter_mentors(company, mentors, [])
        assert result[0].uid == "m2", "Higher-scoring mentor should be first"


class TestFunderHardFilter:
    def test_basic_focus_match(self):
        company = make_company(sector="FinTech", budget_needed=200000)
        funders = [
            make_funder(uid="f1", investment_focus=["FinTech"]),
            make_funder(uid="f2", investment_focus=["HealthTech"]),
        ]
        result = filter_funders(company, funders)
        uids = [f.uid for f in result]
        assert "f1" in uids
        assert "f2" not in uids

    def test_stage_filter(self):
        company = make_company(sector="FinTech", stage="Seed", budget_needed=200000)
        funders = [
            make_funder(uid="f1", investment_focus=["FinTech"], stage_interest="Seed"),
            make_funder(uid="f2", investment_focus=["FinTech"], stage_interest="Series A"),
            make_funder(uid="f3", investment_focus=["FinTech"], stage_interest="All Stages"),
        ]
        result = filter_funders(company, funders)
        uids = [f.uid for f in result]
        assert "f1" in uids, "Matching stage should pass"
        assert "f2" not in uids, "Non-matching stage should be filtered"
        assert "f3" in uids, "'All Stages' should always pass"

    def test_budget_too_small(self):
        company = make_company(sector="FinTech", budget_needed=10000)
        funders = [
            make_funder(uid="f1", investment_focus=["FinTech"], min_investment=50000),
        ]
        result = filter_funders(company, funders)
        assert len(result) == 0, "Company budget below funder minimum should be filtered"

    def test_budget_fit(self):
        company = make_company(sector="FinTech", budget_needed=200000)
        funders = [
            make_funder(uid="f1", investment_focus=["FinTech"], min_investment=50000, max_investment=500000),
            make_funder(uid="f2", investment_focus=["FinTech"], min_investment=50000, max_investment=100000),
        ]
        result = filter_funders(company, funders)
        # f1 is perfect fit, f2 can partially fund (budget > max but >= min)
        assert len(result) == 2, "Both should pass (f2 can partially fund)"


# ── Run tests ───────────────────────────────────────────────────────

def run_tests():
    """Simple test runner — no pytest required."""
    test_classes = [TestMentorHardFilter, TestFunderHardFilter]
    total = 0
    passed = 0
    failed = 0

    for cls in test_classes:
        instance = cls()
        for method_name in dir(instance):
            if method_name.startswith("test_"):
                total += 1
                try:
                    getattr(instance, method_name)()
                    print(f"  PASS {cls.__name__}.{method_name}")
                    passed += 1
                except AssertionError as e:
                    print(f"  FAIL {cls.__name__}.{method_name}: {e}")
                    failed += 1
                except Exception as e:
                    print(f"  FAIL {cls.__name__}.{method_name}: UNEXPECTED ERROR: {e}")
                    failed += 1

    print(f"\n{'=' * 40}")
    print(f"Results: {passed}/{total} passed, {failed} failed")
    if failed == 0:
        print("All tests passed!")
    return failed == 0


if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
