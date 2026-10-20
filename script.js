const searchInput = document.querySelector('#search');
const departmentFilter = document.querySelector('#department-filter');
const sortFilter = document.querySelector('#sort-filter');
const clearButton = document.querySelector('#clear-button, #clearSearch');
const resultsCount = document.querySelector('#results-count');
const employeeList = document.querySelector('#employee-list');

let employees = [];

function createStatisticsSection() {
    if (document.querySelector('.statistics-section')) {
        return document.querySelector('.statistics-section');
    }

    const section = document.createElement('section');

    section.className = 'statistics-section';
    section.setAttribute('aria-label', 'Employee statistics');

    section.innerHTML = `
        <article class="stat-card stat-blue">
            <div class="stat-icon">👥</div>
            <div>
                <h2 id="total-employees">0</h2>
                <p>Total Employees</p>
            </div>
        </article>

        <article class="stat-card stat-purple">
            <div class="stat-icon">▥</div>
            <div>
                <h2 id="total-departments">0</h2>
                <p>Departments</p>
            </div>
        </article>

        <article class="stat-card stat-orange">
            <div class="stat-icon">▥</div>
            <div>
                <h2 id="total-roles">0</h2>
                <p>Roles</p>
            </div>
        </article>

        <article class="stat-card stat-teal">
            <div class="stat-icon">⊕</div>
            <div>
                <h2 id="new-employees">N/A</h2>
                <p>New This Month</p>
            </div>
        </article>
    `;

    const heroSection = document.querySelector('.hero-section');
    const directorySection = document.querySelector('.directory-section');

    if (heroSection) {
        heroSection.insertAdjacentElement('afterend', section);
    } else if (directorySection) {
        directorySection.insertAdjacentElement('afterbegin', section);
    }

    return section;
}

function updateStatistics() {
    createStatisticsSection();

    const departments = new Set(
        employees
            .map(employee => employee.department)
            .filter(Boolean)
    );

    const roles = new Set(
        employees
            .map(employee => employee.title)
            .filter(Boolean)
    );

    document.querySelector('#total-employees').textContent =
        employees.length;

    document.querySelector('#total-departments').textContent =
        departments.size;

    document.querySelector('#total-roles').textContent =
        roles.size;

    const hasJoiningDate = employees.some(employee =>
        employee.joiningDate ||
        employee.joinedDate ||
        employee.startDate
    );

    if (!hasJoiningDate) {
        document.querySelector('#new-employees').textContent = 'N/A';
        return;
    }

    const currentDate = new Date();

    const newEmployees = employees.filter(employee => {
        const joiningDateValue =
            employee.joiningDate ||
            employee.joinedDate ||
            employee.startDate;

        const joiningDate = new Date(joiningDateValue);

        return (
            !Number.isNaN(joiningDate.getTime()) &&
            joiningDate.getMonth() === currentDate.getMonth() &&
            joiningDate.getFullYear() === currentDate.getFullYear()
        );
    });

    document.querySelector('#new-employees').textContent =
        newEmployees.length;
}

function setupBackToTopButton() {
    if (document.querySelector('.back-to-top')) {
        return;
    }

    const button = document.createElement('button');

    button.className = 'back-to-top';
    button.type = 'button';
    button.textContent = '↑';
    button.setAttribute('aria-label', 'Back to top');

    document.body.appendChild(button);

    function updateButtonVisibility() {
        button.classList.toggle(
            'show',
            window.scrollY > 300
        );
    }

    window.addEventListener(
        'scroll',
        updateButtonVisibility,
        { passive: true }
    );

    button.addEventListener('click', () => {
        const reducedMotion = window.matchMedia(
            '(prefers-reduced-motion: reduce)'
        ).matches;

        window.scrollTo({
            top: 0,
            behavior: reducedMotion ? 'auto' : 'smooth'
        });
    });

    updateButtonVisibility();
}

setupBackToTopButton();

const socialIcons = {
    linkedin: 'img/logo/linkedInLogo.png',
    github: 'img/logo/gitHubLogo.png',
    portfolio: 'img/logo/websiteLogo.png'
};

function isSafeExternalUrl(link) {
    if (!link || typeof link !== 'string') {
        return false;
    }

    try {
        const url = new URL(link);

        return (
            url.protocol === 'https:' ||
            url.protocol === 'http:'
        );
    } catch {
        return false;
    }
}

function makeCard(employee) {
    const card = document.createElement('article');
    card.className = 'employee-card';

    const avatar = document.createElement('div');
    avatar.className = 'employee-avatar';

    if (employee.image) {
        avatar.style.backgroundImage =
            `url("${employee.image}")`;
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

    const department = document.createElement('p');
    department.className = 'department-badge';
    department.textContent = employee.department;

    const email = document.createElement('a');
    email.href = `mailto:${employee.email}`;
    email.textContent = employee.email;

    const copyButton = document.createElement('button');
    copyButton.className = 'copy-email';
    copyButton.type = 'button';
    copyButton.textContent = 'Copy Email';

    copyButton.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(employee.email);
            copyButton.textContent = 'Copied ✓';

            setTimeout(() => {
                copyButton.textContent = 'Copy Email';
            }, 1500);
        } catch {
            copyButton.textContent = 'Copy failed';
        }
    });

    const profileButton = document.createElement('button');
    profileButton.className = 'profile-button';
    profileButton.type = 'button';
    profileButton.textContent = 'View Profile';

    profileButton.addEventListener('click', () => {
        openProfile(employee);
    });

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
        if (!isSafeExternalUrl(profile.url)) {
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

    card.append(
        avatar,
        name,
        title,
        department,
        email,
        copyButton,
        profileButton,
        socialLinks
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
    closeButton.type = 'button';
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
        `${employee.name} is a ${employee.title} on the ${employee.department} team.`;

    const skillsHeading = document.createElement('h3');
    skillsHeading.className = 'skills-heading';
    skillsHeading.textContent = 'Skills';

    const skills = document.createElement('p');
    skills.className = 'profile-skills';
    skills.textContent =
        Array.isArray(employee.skills) && employee.skills.length
            ? employee.skills.join(' • ')
            : 'Skills not listed';

    const email = document.createElement('p');

    const emailLink = document.createElement('a');
    emailLink.href = `mailto:${employee.email}`;
    emailLink.textContent = employee.email;

    email.appendChild(emailLink);

    const socialLinks = document.createElement('div');
    socialLinks.className = 'social-links';

    const socialProfiles = [
        {
            name: 'LinkedIn',
            url: employee.linkedin
        },
        {
            name: 'GitHub',
            url: employee.github
        },
        {
            name: 'Portfolio',
            url: employee.portfolio
        }
    ];

    socialProfiles.forEach(profile => {
        if (!isSafeExternalUrl(profile.url)) {
            return;
        }

        const link = document.createElement('a');

        link.href = profile.url;
        link.textContent = profile.name;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';

        socialLinks.appendChild(link);
    });

    content.append(
        closeButton,
        image,
        name,
        title,
        department,
        bio,
        skillsHeading,
        skills,
        email,
        socialLinks
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
            document.removeEventListener(
                'keydown',
                closeWithEscape
            );
        }
    }

    document.addEventListener(
        'keydown',
        closeWithEscape
    );
}

function renderEmployees() {
    const query =
        searchInput.value.trim().toLowerCase();

    const selectedDepartment =
        departmentFilter.value;

    const selectedSort =
        sortFilter.value;

    const matchingEmployees = employees.filter(employee => {
        const matchesSearch = [
            employee.name,
            employee.title,
            employee.department,
            employee.email
        ].some(value =>
            String(value || '')
                .toLowerCase()
                .includes(query)
        );

        const matchesDepartment =
            selectedDepartment === 'all' ||
            String(employee.department || '')
                .toLowerCase() === selectedDepartment;

        return matchesSearch && matchesDepartment;
    });

    matchingEmployees.sort((employeeA, employeeB) => {
        const nameA =
            String(employeeA.name || '').trim();

        const nameB =
            String(employeeB.name || '').trim();

        const comparison = nameA.localeCompare(
            nameB,
            undefined,
            { sensitivity: 'base' }
        );

        return selectedSort === 'za'
            ? -comparison
            : comparison;
    });

    resultsCount.textContent =
        `Showing ${matchingEmployees.length} of ${employees.length} ${
            matchingEmployees.length === 1
                ? 'employee'
                : 'employees'
        }`;

    employeeList.replaceChildren();

    if (matchingEmployees.length === 0) {
        const message = document.createElement('p');

        message.className = 'empty-state';
        message.textContent =
            'No employees found. Try another search.';

        employeeList.appendChild(message);
        return;
    }

    employeeList.append(
        ...matchingEmployees.map(makeCard)
    );
}

searchInput.addEventListener(
    'input',
    renderEmployees
);

departmentFilter.addEventListener(
    'change',
    renderEmployees
);

sortFilter.addEventListener(
    'change',
    renderEmployees
);

if (clearButton) {
    clearButton.addEventListener('click', () => {
        searchInput.value = '';
        departmentFilter.value = 'all';
        sortFilter.value = 'az';
        renderEmployees();
    });
}

let directoryRequest = 0;
async function loadEmployees() {
    const request = ++directoryRequest;
    const refresh = document.querySelector('#refresh-directory');
    const status = document.querySelector('#directory-status');
    refresh.disabled = true;
    refresh.textContent = 'Refreshing…';
    status.hidden = true;
    try {
        if (!window.EmployeeStore) throw new Error('Connection unavailable');
        const data = await window.EmployeeStore.list();
        if (request !== directoryRequest) return;
        employees = data;
        updateStatistics();
        const selected = departmentFilter.value;
        departmentFilter.replaceChildren();
        const all = document.createElement('option');
        all.value = 'all'; all.textContent = 'All Departments';
        departmentFilter.append(all);
        const departments = [...new Set(employees.map(e => e.department).filter(Boolean))].sort();
        for (const department of departments) {
            const option = document.createElement('option');
            option.value = department.toLowerCase(); option.textContent = department;
            departmentFilter.append(option);
        }
        departmentFilter.value = [...departmentFilter.options].some(o => o.value === selected) ? selected : 'all';
        renderEmployees();
    } catch {
        if (request !== directoryRequest) return;
        status.textContent = employees.length
            ? 'Could not refresh. Showing previously loaded employees. Please try again.'
            : 'The directory is temporarily unavailable. Please try Refresh employees again.';
        status.hidden = false;
        if (!employees.length) { resultsCount.textContent = ''; employeeList.replaceChildren(); }
    } finally {
        if (request === directoryRequest) { refresh.disabled = false; refresh.textContent = 'Refresh employees'; }
    }
}
document.querySelector('#refresh-directory').addEventListener('click', loadEmployees);
loadEmployees();

const menuButton =
    document.querySelector('.menu-toggle');

const navigation =
    document.querySelector('.nav-links');

if (menuButton && navigation) {
    function closeMenu() {
        navigation.classList.remove('open');

        menuButton.setAttribute(
            'aria-expanded',
            'false'
        );

        menuButton.setAttribute(
            'aria-label',
            'Open navigation menu'
        );

        menuButton.textContent = '☰';
    }

    menuButton.addEventListener('click', () => {
        const isOpen =
            navigation.classList.toggle('open');

        menuButton.setAttribute(
            'aria-expanded',
            String(isOpen)
        );

        menuButton.setAttribute(
            'aria-label',
            isOpen
                ? 'Close navigation menu'
                : 'Open navigation menu'
        );

        menuButton.textContent =
            isOpen ? '×' : '☰';
    });

    navigation.querySelectorAll('a')
        .forEach(link => {
            link.addEventListener(
                'click',
                closeMenu
            );
        });

    navigation.addEventListener(
        'keydown',
        event => {
            if (event.key === 'Escape') {
                closeMenu();
                menuButton.focus();
            }
        }
    );

    function updateActiveLink() {
        const current =
            window.location.hash || '#Home';

        navigation.querySelectorAll('a')
            .forEach(link => {
                const isActive =
                    link.getAttribute('href') === current;

                link.classList.toggle(
                    'active',
                    isActive
                );

                if (isActive) {
                    link.setAttribute(
                        'aria-current',
                        'location'
                    );
                } else {
                    link.removeAttribute(
                        'aria-current'
                    );
                }
            });
    }

    window.addEventListener(
        'hashchange',
        updateActiveLink
    );

    updateActiveLink();
}
