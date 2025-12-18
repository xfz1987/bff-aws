document.addEventListener('DOMContentLoaded', () => {
  // --- User CRUD Logic ---
  const userForm = document.getElementById('user-form');
  const userList = document.getElementById('user-list');
  const emailInput = document.getElementById('email');
  const nameInput = document.getElementById('name');
  const userIdInput = document.getElementById('user-id'); // Hidden input for updates

  // Fetch and display users
  async function fetchUsers() {
    try {
      const response = await fetch('/api/users');
      const result = await response.json();
      if (result.code === 0) {
        renderUsers(result.data);
      } else {
        console.error('Failed to fetch users:', result.message);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }

  function renderUsers(users) {
    userList.innerHTML = '';
    users.forEach(user => {
      const div = document.createElement('div');
      div.className = 'user-item';
      div.innerHTML = `
        <div class="user-info">
          <h3>${escapeHtml(user.name || 'No Name')}</h3>
          <p>${escapeHtml(user.email)}</p>
        </div>
        <div class="user-actions">
          <button class="btn-edit" onclick="editUser('${user.id}', '${escapeHtml(user.email)}', '${escapeHtml(user.name || '')}')">Edit</button>
          <button class="btn-danger" onclick="deleteUser('${user.id}')">Delete</button>
        </div>
      `;
      userList.appendChild(div);
    });
  }

  // Add/Update User
  userForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailInput.value;
    const name = nameInput.value;
    const id = userIdInput.value;

    const url = id ? `/api/users/${id}` : '/api/users';
    const method = id ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, name }),
      });
      const result = await response.json();

      if (result.code === 0) {
        fetchUsers();
        resetForm();
      } else {
        alert('Error: ' + result.message);
      }
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Failed to save user');
    }
  });

  window.deleteUser = async (id) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      const response = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      const result = await response.json();
      if (result.code === 0) {
        fetchUsers();
      } else {
        alert('Error deleting user: ' + result.message);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  window.editUser = (id, email, name) => {
    userIdInput.value = id;
    emailInput.value = email;
    nameInput.value = name;
    document.querySelector('button[type="submit"]').textContent = 'Update User';
  };

  function resetForm() {
    userIdInput.value = '';
    emailInput.value = '';
    nameInput.value = '';
    document.querySelector('button[type="submit"]').textContent = 'Create User';
  }

  function escapeHtml(text) {
    if (!text) return '';
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // --- GitHub Logic ---
  const githubForm = document.getElementById('github-form');
  const githubTokenInput = document.getElementById('github-token');
  const githubProfile = document.getElementById('github-profile');

  githubForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = githubTokenInput.value.trim();
    if (!token) return;

    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch GitHub profile');
      }

      const data = await response.json();
      renderGithubProfile(data);
    } catch (error) {
      alert(error.message);
      githubProfile.classList.remove('active');
    }
  });

  function renderGithubProfile(data) {
    githubProfile.innerHTML = `
      <img src="${data.avatar_url}" alt="Avatar" class="avatar">
      <h2>${escapeHtml(data.name)}</h2>
      <p style="color: var(--text-muted); margin-bottom: 1rem;">@${escapeHtml(data.login)}</p>
      <p>${escapeHtml(data.bio || 'No bio available')}</p>
      
      <div class="stats">
        <div class="stat-item">
          <span class="stat-value">${data.public_repos}</span>
          <span class="stat-label">Repos</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">${data.followers}</span>
          <span class="stat-label">Followers</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">${data.following}</span>
          <span class="stat-label">Following</span>
        </div>
      </div>
      
      <div style="margin-top: 1.5rem">
        <a href="${data.html_url}" target="_blank" style="color: var(--accent); text-decoration: none;">View Profile &rarr;</a>
      </div>
    `;
    githubProfile.classList.add('active');
  }

  // Initial load
  fetchUsers();
});
