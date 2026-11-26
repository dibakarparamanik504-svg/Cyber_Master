from django.db import migrations


DEPARTMENTS = [
    {
        'name': 'Cardiology',
        'category': 'Medicine',
        'icon': '❤️',
        'tagline': 'Heart & Blood Vessels',
        'description': 'Heart and cardiovascular care, ECG, echocardiography and cardiac services.',
        'services': ['ECG', 'Echocardiography', 'Cardiac consultation'],
        'facilities': ['ECG unit', 'Cardiac diagnostic equipment'],
        'floor': 'Illustrative location: Ground Floor',
        'color': 'coral',
    },
    {
        'name': 'Neurology',
        'category': 'Medicine',
        'icon': '🧠',
        'tagline': 'Brain & Nervous System',
        'description': 'Medical services relating to the brain, spinal cord and nervous system.',
        'services': ['Neurological assessment', 'Nerve studies'],
        'facilities': ['Neurology examination unit'],
        'floor': 'Illustrative location: First Floor',
        'color': 'purple',
    },
    {
        'name': 'Orthopaedics',
        'category': 'Surgery',
        'icon': '🦴',
        'tagline': 'Bones & Joints',
        'description': 'Bone, joint, muscle and mobility-related medical services.',
        'services': ['Bone and joint assessment', 'Fracture care'],
        'facilities': ['Orthopaedic examination unit'],
        'floor': 'Illustrative location: First Floor',
        'color': 'blue',
    },
    {
        'name': 'Paediatrics',
        'category': 'Medicine',
        'icon': '👶',
        'tagline': 'Child Healthcare',
        'description': 'Medical care for infants, children and adolescents.',
        'services': ['Child health assessment', 'Growth monitoring'],
        'facilities': ['Paediatric examination unit'],
        'floor': 'Illustrative location: Second Floor',
        'color': 'orange',
    },
    {
        'name': 'Dermatology',
        'category': 'Medicine',
        'icon': '🧴',
        'tagline': 'Skin & Hair',
        'description': 'Medical services relating to skin, hair and nails.',
        'services': ['Skin assessment', 'Dermatological consultation'],
        'facilities': ['Dermatology examination unit'],
        'floor': 'Illustrative location: Second Floor',
        'color': 'pink',
    },
    {
        'name': 'Gynaecology',
        'category': 'Medicine',
        'icon': '🌸',
        'tagline': "Women's Healthcare",
        'description': "Women's reproductive and related healthcare services.",
        'services': ["Women's health consultation", 'Reproductive health care'],
        'facilities': ['Gynaecology examination unit'],
        'floor': 'Illustrative location: Second Floor',
        'color': 'rose',
    },
    {
        'name': 'Ophthalmology',
        'category': 'Medicine',
        'icon': '👁️',
        'tagline': 'Eye Care',
        'description': 'Eye examinations and vision-related healthcare services.',
        'services': ['Eye examination', 'Vision assessment'],
        'facilities': ['Eye examination equipment'],
        'floor': 'Illustrative location: Ground Floor',
        'color': 'cyan',
    },
    {
        'name': 'Radiology',
        'category': 'Diagnostics',
        'icon': '🩻',
        'tagline': 'Medical Imaging',
        'description': 'Diagnostic imaging services such as X-ray, CT and MRI, where available.',
        'services': ['X-ray', 'CT', 'MRI'],
        'facilities': ['Imaging equipment — availability to be verified'],
        'floor': 'Illustrative location: Ground Floor',
        'color': 'indigo',
    },
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
    for data in DEPARTMENTS:
        Department.objects.update_or_create(
            name=data['name'],
            defaults={
                **data,
                'hours': 'Verify with hospital',
                'contact': 'Verify department contact',
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
                'details': 'Connect verified hospital facility inventory to publish availability.',
                'is_verified': False,
                'is_active': True,
            },
        )


def unseed_directory(apps, schema_editor):
    Department = apps.get_model('hospital', 'Department')
    Facility = apps.get_model('hospital', 'Facility')
    Department.objects.filter(name__in=[item['name'] for item in DEPARTMENTS]).delete()
    Facility.objects.filter(name__in=[item[0] for item in FACILITIES]).delete()


class Migration(migrations.Migration):
    dependencies = [
        ('hospital', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(seed_directory, unseed_directory),
    ]
