(function () {
    'use strict';
    const store = window.EmployeeStore;
    const $ = id => document.getElementById(id);
    const fields = ['name', 'title', 'department', 'email', 'bio', 'skills', 'linkedin', 'github', 'portfolio', 'joiningDate'];
    let employees = [];
    let editing = null;
    let pendingDelete = null;
    let previewObjectUrl = null;
    let busy = false;
    let sessionVersion = 0;
    let activeAdminId = null;

    function message(text, error = false) {
        $('admin-status').textContent = text;
        $('admin-status').dataset.error = String(error);
    }
    function setBusy(value) {
        busy = value;
        $('employee-fields').disabled = value;
        document.querySelectorAll('#manager-panel button, #sign-in, #sign-out, #confirm-delete').forEach(b => { b.disabled = value; });
    }
    function preview(url) {
        if (previewObjectUrl) { URL.revokeObjectURL(previewObjectUrl); previewObjectUrl = null; }
        $('photo-preview').hidden = !url;
        if (url) $('photo-preview').src = url;
        else $('photo-preview').removeAttribute('src');
    }
    function clearEditor() {
        editing = null;
        $('employee-form').reset();
        $('editor-title').textContent = 'Add employee';
        $('save-employee').textContent = 'Add employee';
        preview('');
    }
    function edit(employee) {
        if (busy) return;
        clearEditor();
        editing = employee;
        for (const key of fields) $('employee-' + key).value = key === 'skills' ? employee.skills.join(', ') : (employee[key] || '');
        $('editor-title').textContent = 'Edit employee';
        $('save-employee').textContent = 'Save changes';
        preview(employee.image);
        $('employee-name').focus();
        message('Editing ' + employee.name + '. Changes are saved only when you click Save changes.');
    }
    function renderList() {
        const list = $('admin-employees');
        list.replaceChildren();
        $('admin-count').textContent = '(' + employees.length + ')';
        const query = $('admin-search').value.trim().toLowerCase();
        const filtered = employees.filter(e => [e.name, e.title, e.department].some(v => v.toLowerCase().includes(query)));
        for (const employee of filtered.sort((a,b) => a.name.localeCompare(b.name))) {
            const item = document.createElement('li');
            item.className = 'admin-employee';
            const details = document.createElement('div');
            const name = document.createElement('strong'); name.textContent = employee.name;
            const description = document.createElement('p'); description.textContent = employee.title + ' · ' + employee.department;
            details.append(name, description);
            const actions = document.createElement('div'); actions.className = 'employee-row-actions';
            const editButton = document.createElement('button'); editButton.type = 'button'; editButton.textContent = 'Edit'; editButton.setAttribute('aria-label', 'Edit ' + employee.name);
            editButton.addEventListener('click', () => edit(employee));
            const removeButton = document.createElement('button'); removeButton.type = 'button'; removeButton.textContent = 'Remove'; removeButton.className = 'admin-danger'; removeButton.setAttribute('aria-label', 'Remove ' + employee.name);
            removeButton.addEventListener('click', () => {
                if (busy) return;
                pendingDelete = employee;
                $('delete-description').textContent = 'Remove ' + employee.name + ' from the public directory? This cannot be undone from this page.';
                $('delete-dialog').showModal();
            });
            actions.append(editButton, removeButton); item.append(details, actions); list.append(item);
        }
        if (!filtered.length) { const empty = document.createElement('li'); empty.textContent = query ? 'No matching employees.' : 'No employees yet. Add your first employee using the form.'; list.append(empty); }
        $('department-options').replaceChildren(...[...new Set(employees.map(e => e.department))].sort().map(department => {
            const option = document.createElement('option'); option.value = department; return option;
        }));
    }
    async function reloadEmployees() { employees = await store.list(); renderList(); }
    async function refreshSession() {
        const version = ++sessionVersion;
        try {
            const admin = await store.getAdmin();
            if (version !== sessionVersion) return;
            $('login-panel').hidden = !!admin;
            $('manager-panel').hidden = !admin;
            $('session-bar').hidden = !admin;
            if (!admin) {
                activeAdminId = null;
                employees = []; clearEditor();
                message('Sign in to manage employees. Only approved admin accounts can make changes.');
                return;
            }
            $('signed-in-as').textContent = 'Signed in as ' + admin.email;
            if (activeAdminId !== admin.id) {
                clearEditor();
                await reloadEmployees();
                if (version !== sessionVersion) return;
                activeAdminId = admin.id;
                if (version === sessionVersion) message('Ready. Saved employee changes are available to everyone viewing the directory.');
            }
        } catch {
            if (version !== sessionVersion) return;
            activeAdminId = null;
            $('manager-panel').hidden = true; $('session-bar').hidden = true; $('login-panel').hidden = false;
            message('Could not connect. Please refresh and try again.', true);
        }
    }
    if (!store) { message('The login service could not load. Please refresh the page.', true); return; }
    $('login-form').addEventListener('submit', async event => {
        event.preventDefault();
        if (busy || !$('login-form').reportValidity()) return;
        setBusy(true); message('Signing in…');
        try {
            await store.signIn($('login-email').value.trim(), $('login-password').value);
            $('login-password').value = '';
            const admin = await store.getAdmin();
            if (!admin) {
                await store.signOut();
                message('This account is not approved to manage employees. Contact the project owner.', true);
            } else await refreshSession();
        } catch { message('Sign-in failed. Check your email and password, then try again.', true); }
        finally { setBusy(false); }
    });
    $('sign-out').addEventListener('click', async () => {
        try { await store.signOut(); activeAdminId = null; await refreshSession(); }
        catch { message('Could not sign out. Please try again.', true); }
    });
    $('employee-form').addEventListener('submit', async event => {
        event.preventDefault();
        if (busy || !$('employee-form').reportValidity()) return;
        setBusy(true); message(editing ? 'Saving changes…' : 'Adding employee…');
        let uploaded = '';
        let persisted = false;
        const oldPhoto = editing?.image;
        try {
            const input = Object.fromEntries(fields.map(key => [key, $('employee-' + key).value]));
            input.skills = input.skills.split(',').map(s => s.trim()).filter(Boolean);
            const file = $('employee-photo').files[0];
            input.image = $('remove-photo').checked ? '' : (editing?.image || '');
            if (file) input.image = uploaded = await store.uploadPhoto(file);
            const saved = await store.save(input, editing);
            persisted = true;
            employees = employees.filter(e => e.id !== saved.id).concat(saved);
            renderList(); clearEditor(); message(saved.name + ' saved. Refresh the public directory to see the update.');
            if (oldPhoto && oldPhoto !== saved.image) {
                try { await store.removePhotoIfUnused(oldPhoto); }
                catch { message(saved.name + ' saved. The old photo could not be cleaned up yet.'); }
            }
        } catch (error) {
            if (uploaded && !persisted) { try { await store.removePhotoIfUnused(uploaded); } catch { /* Preserve original save error. */ } }
            message(error.message || 'Could not save this employee. Please try again.', true);
        } finally { setBusy(false); }
    });
    $('employee-photo').addEventListener('change', () => {
        const file = $('employee-photo').files[0];
        if (!file) { preview(editing?.image || ''); return; }
        if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 2097152) {
            $('employee-photo').value = ''; message('Choose a JPG, PNG, or WebP photo smaller than 2 MB.', true); return;
        }
        preview(''); previewObjectUrl = URL.createObjectURL(file);
        $('photo-preview').src = previewObjectUrl; $('photo-preview').hidden = false; $('remove-photo').checked = false;
    });
    $('remove-photo').addEventListener('change', () => {
        if ($('remove-photo').checked) { $('employee-photo').value = ''; preview(''); }
        else preview(editing?.image || '');
    });
    $('new-employee').addEventListener('click', () => { if (!busy) { clearEditor(); message('Ready to add a new employee.'); } });
    $('reload-employees').addEventListener('click', async () => {
        if (busy) return;
        setBusy(true);
        try { await reloadEmployees(); message('Employee list refreshed.'); }
        catch { message('Could not refresh employees. Please try again.', true); }
        finally { setBusy(false); }
    });
    $('admin-search').addEventListener('input', renderList);
    $('cancel-delete').addEventListener('click', () => $('delete-dialog').close());
    $('delete-dialog').addEventListener('close', () => { pendingDelete = null; });
    $('confirm-delete').addEventListener('click', async () => {
        if (busy || !pendingDelete) return;
        const employee = pendingDelete; setBusy(true);
        try {
            await store.remove(employee);
            employees = employees.filter(e => e.id !== employee.id); renderList();
            if (editing?.id === employee.id) clearEditor();
            $('delete-dialog').close(); message(employee.name + ' removed from the directory.');
            try { await store.removePhotoIfUnused(employee.image); }
            catch { message(employee.name + ' removed. Photo cleanup could not finish yet.'); }
        } catch (error) { $('delete-dialog').close(); message(error.message || 'Could not remove this employee.', true); }
        finally { setBusy(false); }
    });
    store.onAuthChange(refreshSession);
    refreshSession();
})();
