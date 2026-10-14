const searchInput = document.querySelector('#search');
const departmentFilter = document.querySelector('#department-filter');
const employeeList = document.querySelector('#employee-list');
const resultsCount = document.querySelector('#results-count');

let employees = [];

const socialIcons = {
    linkedin: 'img/logo/linkedInLogo.png',
    github: 'img/logo/gitHubLogo.png',
    portfolio: 'img/logo/websiteLogo.png'
};

function createSocialLinks(employee) {
    const socialLinks = document.createElement('div');
    socialLinks.className = 'social-links';

    const socialProfiles = [
        {
            name: 'LinkedIn',
            url: employee.linkedin,
            icon: socialIcons.linkedin
        },
        {
            name: 'GitHub',
            url: employee.github,
            icon: socialIcons.github
        },
        {
            name: 'Portfolio',
            url: employee.portfolio,
            icon: socialIcons.portfolio
        }
    ];

    socialProfiles.forEach(profile => {
        if (!profile.url) {
            return;
        }

        const link = document.createElement('a');
        link.href = profile.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.setAttribute('aria-label', profile.name);

        const icon = document.createElement('img');
        icon.src = profile.icon;
        icon.alt = profile.name;

        link.appendChild(icon);
        socialLinks.appendChild(link);
    });

    return socialLinks;
}

function makeCard(employee) {
    const card = document.createElement('article');
    card.className = 'employee-card';

    const avatar = document.createElement('div');
    avatar.className = 'employee-avatar';

    if (employee.image) {
        avatar.style.backgroundImage = `url(${employee.image})`;
    } else {
        avatar.textContent = employee.name
            .split(/\s+/)
            .map(part => part[0])
            .slice(0, 2)
            .join('');
    }

    const name = document.createElement('h3');
    name.textContent = employee.name;

    const title = document.createElement('p');
    title.textContent = employee.title;

    const department = document.createElement('span');
    department.className = 'department-badge';
    department.textContent = employee.department;

    const email = document.createElement('a');
    email.href = `mailto:${employee.email}`;
    email.textContent = employee.email;

    const copyButton = document.createElement('button');
    copyButton.className = 'copy-email';
    copyButton.textContent = 'Copy Email';

    copyButton.addEventListener('click', async () => {
        await navigator.clipboard.writeText(employee.email);

        copyButton.textContent = 'Copied ✓';

        setTimeout(() => {
            copyButton.textContent = 'Copy Email';
        }, 1500);
    });

    const profileButton = document.createElement('button');
    profileButton.className = 'profile-button';
    profileButton.textContent = 'View Profile';

    profileButton.addEventListener('click', () => {
        openProfile(employee);
    });

    card.append(
        avatar,
        name,
        title,
        department,
        email,
        copyButton,
        profileButton,
        createSocialLinks(employee)
    );

    return card;
}

function openProfile(employee) {
    const modal = document.createElement('div');
    modal.className = 'profile-modal';

    const content = document.createElement('div');
    content.className = 'profile-modal-content';

    const closeButton = document.createElement('button');
    closeButton.className = 'modal-close';
    closeButton.textContent = '×';
    closeButton.setAttribute('aria-label', 'Close profile');

    const image = document.createElement('img');
    image.src = employee.image || '';
    image.alt = employee.name;

    const name = document.createElement('h2');
    name.textContent = employee.name;

    const title = document.createElement('p');
    title.textContent = employee.title;

    const department = document.createElement('span');
    department.className = 'department-badge';
    department.textContent = employee.department;

    const bio = document.createElement('p');
    bio.className = 'profile-bio';
    bio.textContent =
        employee.bio ||
        `${employee.name} is a ${employee.title} in the ${employee.department} department.`;

    const skillsTitle = document.createElement('h3');
    skillsTitle.className = 'skills-title';
    skillsTitle.textContent = 'Skills';

    const skillsList = document.createElement('ul');
    skillsList.className = 'skills-list';

    const skills = employee.skills || [];

    if (skills.length === 0) {
        const skill = document.createElement('li');
        skill.textContent = 'Skills not listed';
        skillsList.appendChild(skill);
    } else {
        skills.forEach(skillName => {
            const skill = document.createElement('li');
            skill.textContent = skillName;
            skillsList.appendChild(skill);
        });
    }

    const emailContainer = document.createElement('p');

    const emailLink = document.createElement('a');
    emailLink.href = `mailto:${employee.email}`;
    emailLink.textContent = employee.email;

    emailContainer.appendChild(emailLink);

    content.append(
        closeButton,
        image,
        name,
        title,
        department,
        bio,
        skillsTitle,
        skillsList,
        emailContainer,
        createSocialLinks(employee)
    );

    modal.appendChild(content);
    document.body.appendChild(modal);

    closeButton.addEventListener('click', () => {
        modal.remove();
    });

    modal.addEventListener('click', event => {
        if (event.target === modal) {
            modal.remove();
        }
    });

    function closeWithEscape(event) {
        if (event.key === 'Escape') {
            modal.remove();
            document.removeEventListener('keydown', closeWithEscape);
        }
    }

    document.addEventListener('keydown', closeWithEscape);
}

function renderEmployees() {
    const query = searchInput.value.trim().toLowerCase();
    const selectedDepartment = departmentFilter.value;

    const matches = employees.filter(employee => {
        const searchableText = [
            employee.name,
            employee.title,
            employee.department,
            employee.email,
            employee.bio || '',
            ...(employee.skills || [])
        ]
            .join(' ')
            .toLowerCase();

        const matchesSearch = searchableText.includes(query);

        const matchesDepartment =
            selectedDepartment === 'all' ||
            employee.department.toLowerCase() === selectedDepartment;

        return matchesSearch && matchesDepartment;
    });

    resultsCount.textContent =
        `${matches.length} ${
            matches.length === 1 ? 'employee' : 'employees'
        } found.`;

    employeeList.replaceChildren();

    if (matches.length === 0) {
        const message = document.createElement('p');
        message.className = 'empty-state';
        message.textContent =
            'No employees found. Try another search.';

        employeeList.appendChild(message);
        return;
    }

    employeeList.append(...matches.map(makeCard));
}

searchInput.addEventListener('input', renderEmployees);
departmentFilter.addEventListener('change', renderEmployees);

fetch('employees.json')
    .then(response => {
        if (!response.ok) {
            throw new Error('Could not load employee data');
        }

        return response.json();
    })
    .then(data => {
        if (!Array.isArray(data)) {
            throw new Error('Employee data must be a list');
        }

        employees = data;

        const departments = [
            ...new Set(
                employees.map(employee => employee.department)
            )
        ];

        departments.forEach(department => {
            const option = document.createElement('option');

            option.value = department.toLowerCase();
            option.textContent = department;

            departmentFilter.appendChild(option);
        });

        renderEmployees();
    })
    .catch(error => {
        console.error(error);

        resultsCount.textContent = '';
        employeeList.textContent =
            'Employee data could not load. Open this project with Live Server and try again.';
    });
