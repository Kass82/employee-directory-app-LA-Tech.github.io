#title.textContent = employee.title;

    const department = document.createElement('p');
    department.className =
        'department-badge ' + employee.department.toLowerCase();
    department.textContent = employee.department;

  
    const email = document.createElement('a');
    email.href = 'mailto:' + employee.email;
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

    const cardSocialLinks = document.createElement('div');
    cardSocialLinks.className = 'social-links';

    const cardSocials = [
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

    cardSocials.forEach(social => {
        if (!isSafeExternalUrl(social.url)) return;

        const link = document.createElement('a');
        link.href = social.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.setAttribute('aria-label', social.name);

        const icon = document.createElement('img');
        icon.src = social.icon;
        icon.alt = social.name;

        link.appendChild(icon);
        cardSocialLinks.appendChild(link);
    });

    card.append(
        avatar,
        name,
        title,
        department,
        email,
        copyButton,
        profileButton,
        cardSocialLinks
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
    department.className =
        'department-badge ' + employee.department.toLowerCase();
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
    emailLink.href = 'mailto:' + employee.email;
    emailLink.textContent = employee.email;

    email.appendChild(emailLink);

    const socialLinks = document.createElement('div');
    socialLinks.className = 'social-links';

    const socialProfiles = [
        {
            name: 'LinkedIn',
            url: employee.linkedin || employee.socials?.linkedin
        },
        {
            name: 'GitHub',
            url: employee.github || employee.socials?.github
        },
        {
            name: 'Portfolio',
            url: employee.portfolio || employee.socials?.portfolio
        }
    ];

    socialProfiles.forEach(profile => {
        if (!isSafeExternalUrl(profile.url)) return;

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

    document.addEventListener('keydown', function closeWithEscape(event) {
        if (event.key === 'Escape') {
            modal.remove();
            document.removeEventListener('keydown', closeWithEscape);
        }
    });
}

function renderEmployees() {
    const query = searchInput.value.trim().toLowerCase();
    const selectedDepartment = departmentFilter.value;
    const selectSort = sortFilter.value;
    const matches = employees.filter(employee => {
        const matchesSearch = [
            employee.name,
            employee.title,
            employee.department,
            employee.email,
            //employee.bio,
            //...(Array.isArray(employee.skills) ? employee.skills : [])
        ].some(value =>
            String(value || '').toLowerCase().includes(query)
        );

        const matchesDepartment =
            selectedDepartment === 'all' ||
            employee.department.toLowerCase() === selectedDepartment;

        return matchesSearch && matchesDepartment;
    });

    matches.sort((employeeA, employeeB) => {
        const nameA = String(employeeA.name || '').trim();
        const nameB = String(employeeB.name || '').trim();
        const comparison = nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
        return selectSort === 'za' ? -comparison : comparison;
    });

   resultsCount.textContent =
        `Showing ${matches.length} of ${employees.length} ${
            matches.length === 1 ? 'employee' : 'employees'
        }`;

    employeeList.replaceChildren();

    if (matches.length === 0) {
        const message = document.createElement('p');
        message.className = 'empty-state';
        message.textContent = 'No employees found. Try another search.';
        employeeList.append(message);
        return;
    }

    employeeList.append(...matches.map(makeCard));
}



searchInput.addEventListener('input', renderEmployees);
departmentFilter.addEventListener('change', renderEmployees);
sortFilter.addEventListener('change', renderEmployees);

clearSearch.addEventListener('click', () => {
    searchInput.value = '';
    departmentFilter.value = 'all';
    sortFilter.value = 'none';
    renderEmployees();
});

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
            ...new Set(employees.map(employee => employee.department))
        ];

        departments.forEach(department => {
            const option = document.createElement('option');

            option.value = department.toLowerCase();
            option.textContent = department;

            departmentFilter.appendChild(option);
        });

        renderEmployees();
    })
    .catch(() => {
        resultsCount.textContent = '';
        employeeList.textContent =
            'Employee data could not load. Open this project with Live Server and try again.';
    });

const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.nav-links');
if (menuButton && navigation) {
    function closeMenu() {
        navigation.classList.remove('open');
        menuButton.setAttribute('aria-expanded', 'false');
        menuButton.setAttribute('aria-label', 'Open navigation menu');
        menuButton.textContent = '☰';
    }
    menuButton.addEventListener('click', () => {
        const isOpen = navigation.classList.toggle('open');
        menuButton.setAttribute('aria-expanded', String(isOpen));
        menuButton.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
        menuButton.textContent = isOpen ? '×' : '☰';
    });
    navigation.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', closeMenu);
    });
    navigation.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            closeMenu();
            menuButton.focus();
        }
    });
    menuButton.addEventListener('keydown', event => {
        if (event.key === 'Escape') closeMenu();
    });
    function updateActiveLink() {
        const current = window.location.hash || '#Home';
        navigation.querySelectorAll('a').forEach(link => {
            const active = link.getAttribute('href') === current;
            link.classList.toggle('active', active);
            if (active) link.setAttribute('aria-current', 'location');
            else link.removeAttribute('aria-current');
        });
    }
    window.addEventListener('hashchange', updateActiveLink);
    updateActiveLink();
}
const searchInput = document.querySelector("#search");
const departmentFilter = document.querySelector("#department-filter");
const sortFilter = document.querySelector("#sort-filter");
const clearButton = document.querySelector(
    "#clear-button, #clearSearch"
);
const resultsCount = document.querySelector("#results-count");
const employeeList = document.querySelector("#employee-list");

let employees = [];

const socialIcons = {
    linkedin: "img/logo/linkedInLogo.png",
    github: "img/logo/gitHubLogo.png",
    portfolio: "img/logo/websiteLogo.png"
};

function isSafeExternalUrl(link) {
    if (typeof link !== "string" || !link.trim()) {
        return false;
    }

    try {
        const url = new URL(link);

        return (
            url.protocol === "https:" ||
            url.protocol === "http:"
        );
    } catch {
        return false;
    }
}

function createStatisticsSection() {
    if (document.querySelector(".statistics-section")) {
        return;
    }

    const statisticsSection = document.createElement("section");

    statisticsSection.className = "statistics-section";
    statisticsSection.setAttribute(
        "aria-label",
        "Employee statistics"
    );

    statisticsSection.innerHTML = `
        <div class="stat-card stat-blue">
            <span class="stat-icon">👥</span>
            <div>
                <p>Total Employees</p>
                <h2 id="total-employees">0</h2>
            </div>
        </div>

        <div class="stat-card stat-purple">
            <span class="stat-icon">🏢</span>
            <div>
                <p>Departments</p>
                <h2 id="total-departments">0</h2>
            </div>
        </div>

        <div class="stat-card stat-green">
            <span class="stat-icon">💼</span>
            <div>
                <p>Roles</p>
                <h2 id="total-roles">0</h2>
            </div>
        </div>

        <div class="stat-card stat-orange">
            <span class="stat-icon">🆕</span>
            <div>
                <p>New This Month</p>
                <h2 id="new-employees">0</h2>
            </div>
        </div>
    `;

    const heroSection = document.querySelector(".hero-section");
    const directorySection =
        document.querySelector(".directory-section");

    if (heroSection) {
        heroSection.insertAdjacentElement(
            "afterend",
            statisticsSection
        );
    } else if (directorySection) {
        directorySection.insertAdjacentElement(
            "beforebegin",
            statisticsSection
        );
    } else {
        document.body.prepend(statisticsSection);
    }
}

function updateStatistics() {
    const departments = new Set(
        employees.map(employee =>
            String(employee.department || "")
                .trim()
                .toLowerCase()
        )
    );

    const roles = new Set(
        employees.map(employee =>
            String(employee.title || "")
                .trim()
                .toLowerCase()
        )
    );

    const currentDate = new Date();

    const newEmployeesThisMonth = employees.filter(employee => {
        const employeeDate =
            employee.startDate || employee.joinedDate;

        if (!employeeDate) {
            return false;
        }

        const startDate = new Date(employeeDate);

        return (
            !Number.isNaN(startDate.getTime()) &&
            startDate.getMonth() === currentDate.getMonth() &&
            startDate.getFullYear() === currentDate.getFullYear()
        );
    });

    document.querySelector("#total-employees").textContent =
        employees.length;

    document.querySelector("#total-departments").textContent =
        departments.size;

    document.querySelector("#total-roles").textContent =
        roles.size;

    document.querySelector("#new-employees").textContent =
        newEmployeesThisMonth.length;
}

function setupBackToTopButton() {
    const backToTopButton = document.createElement("button");

    backToTopButton.id = "back-to-top";
    backToTopButton.className = "back-to-top";
    backToTopButton.type = "button";
    backToTopButton.textContent = "↑";

    backToTopButton.setAttribute(
        "aria-label",
        "Back to top"
    );

    document.body.appendChild(backToTopButton);

    window.addEventListener("scroll", () => {
        backToTopButton.classList.toggle(
            "show",
            window.scrollY > 300
        );
    });

    backToTopButton.addEventListener("click", () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });
}

function makeCard(employee) {
    const card = document.createElement("article");
    card.className = "employee-card";

    const avatar = document.createElement("div");
    avatar.className = "employee-avatar";

    if (employee.name === "Omid Ahmadi") {
        avatar.classList.add("omid-avatar");
    }

    if (employee.image) {
        avatar.style.backgroundImage =
            `url("${employee.image}")`;
    } else {
        avatar.textContent = employee.name
            .split(/\s+/)
            .map(part => part[0])
            .slice(0, 2)
            .join("");
    }

    const name = document.createElement("h3");
    name.textContent = employee.name;

    const title = document.createElement("p");
    title.textContent = employee.title;

    const department = document.createElement("p");
    department.className =
        "department-badge " +
        employee.department.toLowerCase();

    department.textContent = employee.department;

    const email = document.createElement("a");
    email.href = "mailto:" + employee.email;
    email.textContent = employee.email;

    const copyButton = document.createElement("button");
    copyButton.className = "copy-email";
    copyButton.type = "button";
    copyButton.textContent = "Copy Email";

    copyButton.addEventListener("click", async () => {
        try {
            await navigator.clipboard.writeText(employee.email);
            copyButton.textContent = "Copied ✓";
        } catch {
            copyButton.textContent = "Copy failed";
        }

        setTimeout(() => {
            copyButton.textContent = "Copy Email";
        }, 1500);
    });

    const profileButton = document.createElement("button");
    profileButton.className = "profile-button";
    profileButton.type = "button";
    profileButton.textContent = "View Profile";

    profileButton.addEventListener("click", () => {
        openProfile(employee);
    });

    const cardSocialLinks = document.createElement("div");
    cardSocialLinks.className = "social-links";

    const cardSocials = [
        {
            name: "LinkedIn",
            url: employee.linkedin,
            icon: socialIcons.linkedin
        },
        {
            name: "GitHub",
            url: employee.github,
            icon: socialIcons.github
        },
        {
            name: "Portfolio",
            url: employee.portfolio,
            icon: socialIcons.portfolio
        }
    ];

    cardSocials.forEach(social => {
        if (!isSafeExternalUrl(social.url)) {
            return;
        }

        const link = document.createElement("a");
        link.href = social.url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.setAttribute("aria-label", social.name);

        const icon = document.createElement("img");
        icon.src = social.icon;
        icon.alt = social.name;

        link.appendChild(icon);
        cardSocialLinks.appendChild(link);
    });

    card.append(
        avatar,
        name,
        title,
        department,
        email,
        copyButton,
        profileButton,
        cardSocialLinks
    );

    return card;
}

function openProfile(employee) {
    const modal = document.createElement("div");
    modal.className = "profile-modal";

    const content = document.createElement("div");
    content.className = "profile-modal-content";

    const closeButton = document.createElement("button");
    closeButton.className = "modal-close";
    closeButton.type = "button";
    closeButton.textContent = "×";

    closeButton.setAttribute(
        "aria-label",
        "Close profile"
    );

    const image = document.createElement("img");
    image.src = employee.image || "";
    image.alt = employee.name;

    const name = document.createElement("h2");
    name.textContent = employee.name;

    const title = document.createElement("p");
    title.textContent = employee.title;

    const department = document.createElement("span");
    department.className =
        "department-badge " +
        employee.department.toLowerCase();

    department.textContent = employee.department;

    const bio = document.createElement("p");
    bio.className = "profile-bio";
    bio.textContent =
        employee.bio ||
        `${employee.name} is a ${employee.title} on the ${employee.department} team.`;

    const skillsHeading = document.createElement("h3");
    skillsHeading.className = "skills-title";
    skillsHeading.textContent = "Skills";

    const skillsList = document.createElement("ul");
    skillsList.className = "skills-list";

    if (
        Array.isArray(employee.skills) &&
        employee.skills.length
    ) {
        employee.skills.forEach(skill => {
            const skillItem = document.createElement("li");
            skillItem.textContent = skill;
            skillsList.appendChild(skillItem);
        });
    } else {
        const skillItem = document.createElement("li");
        skillItem.textContent = "Skills not listed";
        skillsList.appendChild(skillItem);
    }

    const email = document.createElement("p");
    const emailLink = document.createElement("a");

    emailLink.href = "mailto:" + employee.email;
    emailLink.textContent = employee.email;

    email.appendChild(emailLink);

    const socialLinks = document.createElement("div");
    socialLinks.className = "social-links";

    const socialProfiles = [
        {
            name: "LinkedIn",
            url: employee.linkedin
        },
        {
            name: "GitHub",
            url: employee.github
        },
        {
            name: "Portfolio",
            url: employee.portfolio
        }
    ];

    socialProfiles.forEach(profile => {
        if (!isSafeExternalUrl(profile.url)) {
            return;
        }

        const link = document.createElement("a");
        link.href = profile.url;
        link.textContent = profile.name;
        link.target = "_blank";
        link.rel = "noopener noreferrer";

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
        skillsList,
        email,
        socialLinks
    );

    modal.appendChild(content);
    document.body.appendChild(modal);

    closeButton.addEventListener("click", () => {
        modal.remove();
    });

    modal.addEventListener("click", event => {
        if (event.target === modal) {
            modal.remove();
        }
    });

    document.addEventListener(
        "keydown",
        function closeWithEscape(event) {
            if (event.key === "Escape") {
                modal.remove();

                document.removeEventListener(
                    "keydown",
                    closeWithEscape
                );
            }
        }
    );
}

function renderEmployees() {
    const query = searchInput.value.trim().toLowerCase();
    const selectedDepartment =
        departmentFilter.value;
    const selectedSort = sortFilter.value;

    const matches = employees.filter(employee => {
        const searchableText = [
            employee.name,
            employee.title,
            employee.department,
            employee.email,
            employee.bio,
            ...(Array.isArray(employee.skills)
                ? employee.skills
                : [])
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

        const matchesSearch =
            searchableText.includes(query);

        const matchesDepartment =
            selectedDepartment === "all" ||
            employee.department.toLowerCase() ===
                selectedDepartment;

        return matchesSearch && matchesDepartment;
    });

    matches.sort((employeeA, employeeB) => {
        const nameA = String(employeeA.name || "").trim();
        const nameB = String(employeeB.name || "").trim();

        const comparison = nameA.localeCompare(
            nameB,
            undefined,
            { sensitivity: "base" }
        );

        return selectedSort === "za"
            ? -comparison
            : comparison;
    });

    resultsCount.textContent =
        `Showing ${matches.length} of ${
            employees.length
        } ${
            matches.length === 1
                ? "employee"
                : "employees"
        }`;

    employeeList.replaceChildren();

    if (matches.length === 0) {
        const message = document.createElement("p");

        message.className = "empty-state";
        message.textContent =
            "No employees found. Try another search.";

        employeeList.appendChild(message);
        return;
    }

    employeeList.append(
        ...matches.map(makeCard)
    );
}

createStatisticsSection();
setupBackToTopButton();

searchInput.addEventListener(
    "input",
    renderEmployees
);

departmentFilter.addEventListener(
    "change",
    renderEmployees
);

sortFilter.addEventListener(
    "change",
    renderEmployees
);

if (clearButton) {
    clearButton.addEventListener("click", () => {
        searchInput.value = "";
        departmentFilter.value = "all";
        sortFilter.value = "az";
        renderEmployees();
    });
}

fetch("employees.json")
    .then(response => {
        if (!response.ok) {
            throw new Error(
                "Could not load employee data"
            );
        }

        return response.json();
    })
    .then(data => {
        if (!Array.isArray(data)) {
            throw new Error(
                "Employee data must be a list"
            );
        }

        employees = data;

        updateStatistics();

        const departments = [
            ...new Set(
                employees.map(
                    employee => employee.department
                )
            )
        ];

        departments.forEach(department => {
            const option =
                document.createElement("option");

            option.value =
                department.toLowerCase();

            option.textContent = department;

            departmentFilter.appendChild(option);
        });

        renderEmployees();
    })
    .catch(() => {
        resultsCount.textContent = "";

        employeeList.textContent =
            "Employee data could not load. Open this project with Live Server and try again.";
    });

const menuButton =
    document.querySelector(".menu-toggle");

const navigation =
    document.querySelector(".nav-links");

if (menuButton && navigation) {
    function closeMenu() {
        navigation.classList.remove("open");

        menuButton.setAttribute(
            "aria-expanded",
            "false"
        );

        menuButton.setAttribute(
            "aria-label",
            "Open navigation menu"
        );

        menuButton.textContent = "☰";
    }

    menuButton.addEventListener("click", () => {
        const isOpen =
            navigation.classList.toggle("open");

        menuButton.setAttribute(
            "aria-expanded",
            String(isOpen)
        );

        menuButton.setAttribute(
            "aria-label",
            isOpen
                ? "Close navigation menu"
                : "Open navigation menu"
        );

        menuButton.textContent =
            isOpen ? "×" : "☰";
    });

    navigation
        .querySelectorAll("a")
        .forEach(link => {
            link.addEventListener(
                "click",
                closeMenu
            );
        });

    navigation.addEventListener(
        "keydown",
        event => {
            if (event.key === "Escape") {
                closeMenu();
                menuButton.focus();
            }
        }
    );

    function updateActiveLink() {
        const current =
            window.location.hash || "#Home";

        navigation
            .querySelectorAll("a")
            .forEach(link => {
                const isActive =
                    link.getAttribute("href") === current;

                link.classList.toggle(
                    "active",
                    isActive
                );

                if (isActive) {
                    link.setAttribute(
                        "aria-current",
                        "location"
                    );
                } else {
                    link.removeAttribute(
                        "aria-current"
                    );
                }
            });
    }

    window.addEventListener(
        "hashchange",
        updateActiveLink
    );

    updateActiveLink();
}
