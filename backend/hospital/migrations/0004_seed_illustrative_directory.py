from django.db import migrations


DEPARTMENTS = [
    ('Cardiology', 'Medicine', 'Heart & Blood Vessels',
     'Heart and cardiovascular care, ECG, echocardiography and cardiac services.',
     ['ECG', 'Echocardiography', 'Cardiac consultation'],
     ['ECG unit', 'Cardiac diagnostic equipment'], 'Ground Floor', 'coral', '❤️'),
    ('Neurology', 'Medicine', 'Brain & Nervous System',
     'Medical services relating to the brain, spinal cord and nervous system.',
     ['Neurological assessment', 'Nerve studies'],
     ['Neurology examination unit'], 'First Floor', 'purple', '🧠'),
    ('Orthopaedics', 'Surgery', 'Bones & Joints',
     'Bone, joint, muscle and mobility-related medical services.',
     ['Bone and joint assessment', 'Fracture care'],
     ['Orthopaedic examination unit'], 'First Floor', 'blue', '🦴'),
    ('Paediatrics', 'Medicine', 'Child Healthcare',
     'Medical care for infants, children and adolescents.',
     ['Child health assessment', 'Growth monitoring'],
     ['Paediatric examination unit'], 'Second Floor', 'orange', '👶'),
    ('Dermatology', 'Medicine', 'Skin & Hair',
     'Medical services relating to skin, hair and nails.',
     ['Skin assessment', 'Dermatological consultation'],
     ['Dermatology examination unit'], 'Second Floor', 'pink', '🧴'),
    ('Gynaecology', 'Medicine', "Women's Healthcare",
     "Women's reproductive and related healthcare services.",
     ["Women's health consultation", 'Reproductive health care'],
     ['Gynaecology examination unit'], 'Second Floor', 'rose', '🌸'),
    ('Ophthalmology', 'Medicine', 'Eye Care',
     'Eye examinations and vision-related healthcare services.',
     ['Eye examination', 'Vision assessment'],
     ['Eye examination equipment'], 'Ground Floor', 'cyan', '👁️'),
    ('Radiology', 'Diagnostics', 'Medical Imaging',
     'Diagnostic imaging services such as X-ray, CT and MRI, where available.',
     ['X-ray', 'CT', 'MRI'],
     ['Imaging equipment — availability to be verified'],
     'Ground Floor', 'indigo', '🩻'),
]

FACILITIES = [
    ('Diagnostic Laboratory', '🧪', 'Laboratory testing and diagnostic support.'),
    ('Imaging Facilities', '🩻', 'Imaging and scanning infrastructure.'),
    ('Operation Theatre', '🏥', 'Surgical infrastructure and equipment.'),
    ('Intensive Care', '🫁', 'Critical-care infrastructure.'),
    ('Rehabilitation', '🦿', 'Physical rehabilitation facilities.'),
    ('Specialized Equipment', '⚕️', 'Department-specific medical equipment.'),
]


def seed_directory(apps, schema_editor):
    Department = apps.get_model('hospital', 'Department')
    Facility = apps.get_model('hospital', 'Facility')
    for (name, category, tagline, description, services, department_facilities,
         floor, color, icon) in DEPARTMENTS:
        Department.objects.update_or_create(
            name=name,
            defaults={
                'category': category,
                'icon': icon,
                'tagline': tagline,
                'description': description,
                'services': services,
                'facilities': department_facilities,
                'floor': f'Illustrative location: {floor}',
                'hours': 'Verify with hospital',
                'contact': 'Verify department contact',
                'phone_extension': '',
                'official_email': '',
                'color': color,
                'is_verified': False,
                'is_active': True,
            },
        )
    for name, icon, description in FACILITIES:
        Facility.objects.update_or_create(
            name=name,
            defaults={
                'icon': icon,
                'description': description,
                'status': 'Verify availability',
                'details': 'Connect verified hospital facility inventory to show equipment, location and availability.',
                'is_verified': False,
                'is_active': True,
            },
        )


def unseed_directory(apps, schema_editor):
    Department = apps.get_model('hospital', 'Department')
    Facility = apps.get_model('hospital', 'Facility')
    Department.objects.filter(name__in=[item[0] for item in DEPARTMENTS]).delete()
    Facility.objects.filter(name__in=[item[0] for item in FACILITIES]).delete()


class Migration(migrations.Migration):
    dependencies = [
        ('hospital', '0003_department_official_email_department_phone_extension'),
    ]

    operations = [
        migrations.RunPython(seed_directory, unseed_directory),
    ]
