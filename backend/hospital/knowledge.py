import re

from .models import Department, Facility, HospitalProfile, Notice, Specialist


MAX_RECORDS = 12
MAX_RECORD_LENGTH = 1400
MAX_CONTEXT_LENGTH = 12000


def _format_fields(fields):
    values = []
    for label, value in fields:
        if value in (None, '', [], {}):
            continue
        if isinstance(value, (list, tuple)):
            value = ', '.join(str(item) for item in value)
        values.append(f'{label}: {value}')
    return '; '.join(values)


def _record_score(query_terms, text):
    words = set(re.findall(r'[^\W_]+', text.casefold(), flags=re.UNICODE))
    return len(query_terms.intersection(words))


def retrieve_hospital_context(query):
    query_terms = {
        word
        for word in re.findall(r'[^\W_]+', str(query).casefold(), flags=re.UNICODE)
        if len(word) > 2
    }
    records = []

    profile = HospitalProfile.objects.first()
    if profile:
        text = _format_fields([
            ('Hospital', profile.name),
            ('Address', profile.address),
            ('Phone', profile.phone),
            ('Email', profile.email),
            ('Contact hours', profile.contact_hours),
            ('Introduction', profile.introduction),
            ('History', profile.history),
            ('Mission', profile.mission),
            ('Vision', profile.vision),
            ('Emergency support information', profile.emergency_support),
        ])
        if text:
            records.append(('Hospital profile', text))

    for department in Department.objects.filter(is_active=True, is_verified=True):
        text = _format_fields([
            ('Department', department.name),
            ('Category', department.category),
            ('Description', department.description),
            ('Services', department.services),
            ('Facilities', department.facilities),
            ('Floor', department.floor),
            ('Hours', department.hours),
            ('Contact', department.contact),
            ('Phone extension', department.phone_extension),
            ('Official email', department.official_email),
        ])
        records.append((f'Department: {department.name}', text))

    for facility in Facility.objects.filter(is_active=True, is_verified=True):
        text = _format_fields([
            ('Facility', facility.name),
            ('Description', facility.description),
            ('Status on record', facility.status),
            ('Details', facility.details),
        ])
        records.append((f'Facility: {facility.name}', text))

    for specialist in Specialist.objects.filter(
        is_active=True,
        is_verified=True,
        department__is_active=True,
        department__is_verified=True,
    ).select_related('department'):
        text = _format_fields([
            ('Specialist', specialist.name),
            ('Department', specialist.department.name),
            ('Qualification', specialist.qualification),
            ('Experience', specialist.experience_years),
            ('Languages', specialist.languages),
        ])
        records.append((f'Specialist: {specialist.name}', text))

    for notice in Notice.objects.filter(is_published=True):
        text = _format_fields([
            ('Title', notice.title),
            ('Notice', notice.body),
        ])
        records.append((f'Official notice: {notice.title}', text))

    records.sort(
        key=lambda record: (-_record_score(query_terms, record[1]), record[0].casefold())
    )

    selected_records = []
    context_length = 0
    for title, text in records:
        entry = f'[{title}]\n{text[:MAX_RECORD_LENGTH]}'
        if context_length + len(entry) > MAX_CONTEXT_LENGTH:
            continue
        selected_records.append((title, entry))
        context_length += len(entry)
        if len(selected_records) >= MAX_RECORDS:
            break

    context = '\n\n'.join(entry for _, entry in selected_records)
    sources = [title for title, _ in selected_records]
    return context, sources
