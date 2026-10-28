# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from importlib import import_module

import pytest
from django.apps import apps as django_apps

from plane.db.models import Profile

from .conftest import make_user


@pytest.mark.unit
@pytest.mark.django_db
def test_new_profile_defaults_to_pt_br():
    profile = Profile.objects.create(user=make_user("ana@semec.local"))
    profile.refresh_from_db()
    assert profile.language == "pt-BR"


@pytest.mark.unit
@pytest.mark.django_db
def test_new_profile_with_other_language_is_kept():
    profile = Profile.objects.create(user=make_user("bia@semec.local"), language="de")
    profile.refresh_from_db()
    assert profile.language == "de"


@pytest.mark.unit
@pytest.mark.django_db
def test_migration_moves_only_english_profiles():
    profiles = {
        language: Profile.objects.create(user=make_user(f"{language.lower()}@semec.local"), language=language)
        for language in ("en", "de", "pt-BR")
    }
    # the signal already moved the new "en" profile; put it back to simulate an existing profile
    Profile.objects.filter(pk=profiles["en"].pk).update(language="en")

    migration = import_module("plane.semec.migrations.0003_profiles_pt_br")
    migration.profiles_to_pt_br(django_apps, None)

    languages = {key: Profile.objects.get(pk=profile.pk).language for key, profile in profiles.items()}
    assert languages == {"en": "pt-BR", "de": "de", "pt-BR": "pt-BR"}
