document.addEventListener('DOMContentLoaded', () => {
  
  const app = new App();
  app.init();
});

class App {
  constructor() {
    this.state = {
      isAuthenticated: false,
      user: null,
      monitors: [],
      currentPage: '',
      currentMonitor: null,
      lastUpdated: null,
      readIncidents: JSON.parse(localStorage.getItem('readIncidents') || '[]')
    };

    
    this.elements = {
      mainContent: document.getElementById('main-content'),
      authButtons: document.getElementById('auth-buttons'),
      userMenu: document.getElementById('user-menu'),
      username: document.getElementById('username'),
      navDashboard: document.getElementById('nav-dashboard'),
      navMonitors: document.getElementById('nav-monitors'),
      logoutBtn: document.getElementById('logout-btn')
    };

    
    this.socket = io();
    
    this.bindMethods();
    this.init();
  }

  
  bindMethods() {
    this.init = this.init.bind(this);
    this.setupEventListeners = this.setupEventListeners.bind(this);
    this.setupSocketListeners = this.setupSocketListeners.bind(this);
    this.setupRouting = this.setupRouting.bind(this);
    this.navigate = this.navigate.bind(this);
    this.checkAuth = this.checkAuth.bind(this);
    this.loadMonitors = this.loadMonitors.bind(this);
    this.showHome = this.showHome.bind(this);
    this.showDashboard = this.showDashboard.bind(this);
    this.showMonitors = this.showMonitors.bind(this);
    this.showMonitorDetails = this.showMonitorDetails.bind(this);
    this.renderMonitorsTable = this.renderMonitorsTable.bind(this);
    this.addMonitorToTable = this.addMonitorToTable.bind(this);
    this.updateMonitorCounts = this.updateMonitorCounts.bind(this);
    this.updateMonitorInTable = this.updateMonitorInTable.bind(this);
    this.addMonitor = this.addMonitor.bind(this);
    this.editMonitor = this.editMonitor.bind(this);
    this.handleMonitorTypeChange = this.handleMonitorTypeChange.bind(this);
    this.saveMonitor = this.saveMonitor.bind(this);
    this.deleteMonitor = this.deleteMonitor.bind(this);
    this.confirmDeleteMonitor = this.confirmDeleteMonitor.bind(this);
    this.checkMonitorNow = this.checkMonitorNow.bind(this);
    this.toggleMonitor = this.toggleMonitor.bind(this);
    this.renderMonitorDetails = this.renderMonitorDetails.bind(this);
    this.renderHistoryTable = this.renderHistoryTable.bind(this);
    this.renderResponseTimeChart = this.renderResponseTimeChart.bind(this);
    this.handleLogin = this.handleLogin.bind(this);
    this.handleRegister = this.handleRegister.bind(this);
    this.handleLogout = this.handleLogout.bind(this);
    this.showAlert = this.showAlert.bind(this);
    this.hideAlert = this.hideAlert.bind(this);
    this.formatDate = this.formatDate.bind(this);
    this.formatResponseTime = this.formatResponseTime.bind(this);
    this.renderIncidents = this.renderIncidents.bind(this);
    this.updateNavigation = this.updateNavigation.bind(this);
    this.updateLastUpdatedTime = this.updateLastUpdatedTime.bind(this);
    this.showToast = this.showToast.bind(this);
    this.markIncidentRead = this.markIncidentRead.bind(this);
    this.isIncidentRead = this.isIncidentRead.bind(this);
    this.clearReadIncidents = this.clearReadIncidents.bind(this);
    this.checkAllMonitors = this.checkAllMonitors.bind(this);
    this.isSameMonitor = this.isSameMonitor.bind(this);
  }

  
  async init() {
    
    this.setupEventListeners();
    this.setupSocketListeners();
    this.setupRouting();
    
    
    await this.checkAuth();
    
    
    if (this.state.isAuthenticated) {
      await this.loadMonitors();
    }
    
    
    const path = window.location.pathname;
    this.navigate(path);
    
    
    if (!document.querySelector('.toast-container')) {
      const toastContainer = document.createElement('div');
      toastContainer.className = 'toast-container';
      document.body.appendChild(toastContainer);
    }
    
    
    document.addEventListener('shown.bs.modal', () => {
      document.body.classList.add('modal-open');
    });
    
    document.addEventListener('hidden.bs.modal', () => {
      if (!document.querySelector('.modal.show')) {
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) backdrop.remove();
      }
    });
  }

  
  setupEventListeners() {
    
    document.getElementById('login-form').addEventListener('submit', this.handleLogin);
    document.getElementById('register-form').addEventListener('submit', this.handleRegister);
    document.getElementById('logout-btn').addEventListener('click', this.handleLogout);
    
    
    document.getElementById('monitor-type').addEventListener('change', (e) => {
      this.handleMonitorTypeChange(e.target.value);
    });
    
    
    document.getElementById('confirm-delete-btn').addEventListener('click', () => {
      const monitorId = document.getElementById('confirm-delete-btn').getAttribute('data-monitor-id');
      if (monitorId) {
        this.confirmDeleteMonitor(monitorId);
      }
    });
    
    
    document.addEventListener('click', (e) => {
      
      if (e.target.id === 'check-all-monitors' || e.target.closest('#check-all-monitors')) {
        e.preventDefault();
        this.checkAllMonitors();
      } 
      
      else if (e.target.classList.contains('add-monitor-btn') || 
               e.target.id === 'add-monitor-btn' || 
               e.target.closest('.add-monitor-btn') || 
               e.target.closest('#add-monitor-btn')) {
        e.preventDefault();
        this.addMonitor();
      }
      
      else if (e.target.id === 'clear-read-incidents' || e.target.closest('#clear-read-incidents')) {
        e.preventDefault();
        this.clearReadIncidents();
      }
      
      else if (e.target.classList.contains('mark-read-btn') || e.target.closest('.mark-read-btn')) {
        e.preventDefault();
        const btn = e.target.classList.contains('mark-read-btn') ? e.target : e.target.closest('.mark-read-btn');
        const incidentId = btn.getAttribute('data-incident-id');
        if (incidentId) {
          this.markIncidentRead(incidentId);
        }
      }
      
      else if (e.target.classList.contains('check-btn') || e.target.closest('.check-btn')) {
        e.preventDefault();
        const btn = e.target.classList.contains('check-btn') ? e.target : e.target.closest('.check-btn');
        const monitorId = btn.getAttribute('data-id');
        if (monitorId) {
          this.checkMonitorNow(monitorId);
        }
      }
      else if (e.target.classList.contains('edit-btn') || e.target.closest('.edit-btn')) {
        e.preventDefault();
        const btn = e.target.classList.contains('edit-btn') ? e.target : e.target.closest('.edit-btn');
        const monitorId = btn.getAttribute('data-id');
        if (monitorId) {
          const monitor = this.state.monitors.find(m => this.isSameMonitor(m.id, monitorId) || this.isSameMonitor(m._id, monitorId));
          if (monitor) {
            this.editMonitor(monitor);
          }
        }
      }
      else if (e.target.classList.contains('toggle-btn') || e.target.closest('.toggle-btn')) {
        e.preventDefault();
        const btn = e.target.classList.contains('toggle-btn') ? e.target : e.target.closest('.toggle-btn');
        const monitorId = btn.getAttribute('data-id');
        if (monitorId) {
          this.toggleMonitor(monitorId);
        }
      }
      else if (e.target.classList.contains('delete-btn') || e.target.closest('.delete-btn')) {
        e.preventDefault();
        const btn = e.target.classList.contains('delete-btn') ? e.target : e.target.closest('.delete-btn');
        const monitorId = btn.getAttribute('data-id');
        if (monitorId) {
          this.deleteMonitor(monitorId);
        }
      }
    });
  }

  
  markIncidentRead(incidentId) {
    if (!this.state.readIncidents.includes(incidentId)) {
      this.state.readIncidents.push(incidentId);
      localStorage.setItem('readIncidents', JSON.stringify(this.state.readIncidents));
      
      
      this.renderIncidents();
      this.showToast('Incidente atualizado', 'Incidente marcado como lido.', 'success');
    }
  }
  
  
  isIncidentRead(incidentId) {
    return this.state.readIncidents.includes(incidentId);
  }
  
  
  clearReadIncidents() {
    this.state.readIncidents = [];
    localStorage.setItem('readIncidents', JSON.stringify(this.state.readIncidents));
    
    
    this.renderIncidents();
    this.showToast('Incidentes atualizados', 'Lista de incidentes lidos foi limpa.', 'success');
  }

  
  setupSocketListeners() {
    this.socket.on('connect', () => {
      console.log('Conectado ao servidor via Socket.IO');
      this.updateLastUpdatedTime();
    });
    
    
    this.socket.on('monitor-cache', (monitors) => {
      if (Array.isArray(monitors) && monitors.length > 0) {
        
        monitors.forEach(monitor => {
          const index = this.state.monitors.findIndex(m => 
            this.isSameMonitor(m.id, monitor.id) || this.isSameMonitor(m._id, monitor.id));
          
          if (index !== -1) {
            this.state.monitors[index] = monitor;
          } else {
            this.state.monitors.push(monitor);
          }
        });
        
        
        this.updateUI();
      }
    });
    
    
    this.socket.on('monitor-data', (monitor) => {
      if (monitor && (monitor.id || monitor._id)) {
        const index = this.state.monitors.findIndex(m => 
          this.isSameMonitor(m.id, monitor.id) || this.isSameMonitor(m.id, monitor._id) || 
          this.isSameMonitor(m._id, monitor.id) || this.isSameMonitor(m._id, monitor._id));
        
        if (index !== -1) {
          this.state.monitors[index] = monitor;
        } else {
          this.state.monitors.push(monitor);
        }
        
        
        if (this.state.currentPage === 'monitor-details' && 
            this.state.currentMonitor && 
            (this.isSameMonitor(this.state.currentMonitor.id, monitor.id) || this.isSameMonitor(this.state.currentMonitor._id, monitor.id))) {
          this.renderMonitorDetails(monitor);
        }
      }
    });
    
    this.socket.on('monitor-update', (data) => {
      
      const index = this.state.monitors.findIndex(m => 
        this.isSameMonitor(m.id, data.id) || this.isSameMonitor(m._id, data.id));
        
      if (index !== -1) {
        const monitor = this.state.monitors[index];
        monitor.isUp = data.status;
        monitor.responseTime = data.responseTime;
        monitor.lastChecked = data.lastChecked;
        
        
        if (data.statusChanged && !data.status) {
          if (!monitor.history) {
            monitor.history = [];
          }
          
          monitor.history.unshift({
            isUp: data.status,
            timestamp: data.lastChecked,
            responseTime: data.responseTime,
            statusCode: data.statusCode,
            error: data.error
          });
        }
        
        
        this.updateUI();
        this.updateLastUpdatedTime();
      }
    });
    
    
    this.socket.on('status-changed', (data) => {
      const statusText = data.status ? 'operacional' : 'com problema';
      const statusClass = data.status ? 'success' : 'danger';
      const statusIcon = data.status ? 'check-circle' : 'exclamation-circle';
      
      this.showToast(
        `<i class="bi bi-${statusIcon} text-${statusClass}"></i> Status alterado`,
        `Monitor <strong>${data.name}</strong> agora está ${statusText}.`,
        statusClass
      );
      
      
      this.updateLastUpdatedTime();
    });
    
    
    this.socket.on('disconnect', () => {
      console.log('Desconectado do servidor Socket.IO, tentando reconectar...');
      setTimeout(() => {
        if (this.socket.disconnected) {
          this.socket.connect();
        }
      }, 5000);
    });
  }

  
  setupRouting() {
    
    document.addEventListener('click', (e) => {
      
      if (e.target.tagName === 'A' && 
          e.target.href && 
          e.target.href.startsWith(window.location.origin) &&
          !e.target.hasAttribute('data-bs-toggle') && 
          !e.target.getAttribute('target')) {
        e.preventDefault();
        this.navigate(new URL(e.target.href).pathname);
      }
    });
  }

  
  navigate(path) {
    
    history.pushState(null, '', path);
    
    
    if (path === '/' || path === '') {
      if (this.state.user) {
        this.showDashboard();
      } else {
        this.showHome();
      }
    } else if (path === '/monitors') {
      if (this.state.user) {
        this.showMonitors();
      } else {
        this.navigate('/');
      }
    } else if (path.startsWith('/monitor/')) {
      if (this.state.user) {
        const id = path.split('/monitor/')[1];
        this.showMonitorDetails(id);
      } else {
        this.navigate('/');
      }
    } else {
      
      this.navigate('/');
    }
  }

  
  async checkAuth() {
    try {
      const user = await api.getCurrentUser();
      this.state.user = user;
      this.elements.username.textContent = user.name;
      this.elements.authButtons.classList.add('d-none');
      this.elements.userMenu.classList.remove('d-none');
      
      
      if (user) {
        await this.loadMonitors();
      }
    } catch (error) {
      
      this.state.user = null;
      this.elements.authButtons.classList.remove('d-none');
      this.elements.userMenu.classList.add('d-none');
    }
  }

  
  async loadMonitors() {
    try {
      this.state.monitors = await api.getMonitors();
      return this.state.monitors;
    } catch (error) {
      console.error('Erro ao carregar monitores:', error);
      return [];
    }
  }

  
  showHome() {
    const template = document.getElementById('home-template');
    const content = template.content.cloneNode(true);
    
    this.elements.mainContent.innerHTML = '';
    this.elements.mainContent.appendChild(content);
    
    this.state.currentPage = 'home';
  }

  
  async showDashboard() {
    this.state.currentPage = 'dashboard';
    
    
    this.updateNavigation();
    
    
    const dashboardTemplate = document.getElementById('dashboard-template');
    const content = document.getElementById('main-content');
    
    if (!dashboardTemplate) {
      content.innerHTML = '<div class="alert alert-danger">Modelo de dashboard não encontrado!</div>';
      return;
    }
    
    content.innerHTML = dashboardTemplate.innerHTML;
    
    
    const statsContainer = document.querySelector('.row:first-child');
    if (statsContainer) {
      const lastUpdatedDiv = document.createElement('div');
      lastUpdatedDiv.className = 'col-12 text-end mb-3';
      lastUpdatedDiv.innerHTML = `
        <small class="text-light">
          <i class="bi bi-clock"></i> Última atualização: 
          <span id="last-updated-time">${this.formatDate(this.state.lastUpdated || new Date())}</span>
          <button id="check-all-monitors" class="btn btn-sm btn-outline-light ms-2">
            <i class="bi bi-arrow-clockwise"></i> Verificar todos
          </button>
        </small>
      `;
      statsContainer.appendChild(lastUpdatedDiv);
    }
    
    
    this.renderMonitorsTable();
    
    
    this.updateMonitorCounts();
    
    
    this.renderIncidents(false);
    
    
    this.updateLastUpdatedTime();
  }

  
  async showMonitors() {
    
    const template = document.getElementById('monitors-template');
    const content = template.content.cloneNode(true);
    
    
    this.elements.mainContent.innerHTML = '';
    this.elements.mainContent.appendChild(content);
    
    
    await this.loadMonitors();
    
    
    this.renderMonitorsTable();
    
    this.state.currentPage = 'monitors';
  }

  
  async showMonitorDetails(id) {
    if (!id || id === 'undefined') {
      console.error('ID de monitor inválido');
      this.navigate('/monitors');
      return;
    }

    
    let monitor = this.state.monitors.find(m => this.isSameMonitor(m.id, id) || this.isSameMonitor(m._id, id));
    
    
    if (!monitor) {
      try {
        monitor = await api.getMonitor(id);
        
        this.state.monitors.push(monitor);
      } catch (error) {
        console.error('Erro ao carregar detalhes do monitor:', error);
        this.navigate('/monitors');
        return;
      }
    }
    
    
    this.state.currentMonitor = monitor;
    
    
    const template = document.getElementById('monitor-details-template');
    const content = template.content.cloneNode(true);
    
    
    this.elements.mainContent.innerHTML = '';
    this.elements.mainContent.appendChild(content);
    
    
    this.renderMonitorDetails(monitor);
    
    
    document.getElementById('detail-check-now').addEventListener('click', () => {
      this.checkMonitorNow(monitor.id || monitor._id);
    });
    
    document.getElementById('detail-edit').addEventListener('click', () => {
      this.editMonitor(monitor);
    });
    
    document.getElementById('detail-delete').addEventListener('click', () => {
      this.deleteMonitor(monitor.id || monitor._id);
    });
    
    this.state.currentPage = 'monitor-details';
    this.updateNavigation();
  }

  
  renderMonitorsTable() {
    const tableBody = document.getElementById('monitors-table-body') || document.getElementById('monitors-table');
    if (!tableBody) {
      console.error('Elemento da tabela de monitores não encontrado');
      return;
    }
    
    tableBody.innerHTML = '';
    
    if (this.state.monitors.length === 0) {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td colspan="8" class="text-center">
          Nenhum monitor encontrado. <a href="#" id="empty-add-btn">Adicionar um monitor</a>.
        </td>
      `;
      tableBody.appendChild(row);
      
      document.getElementById('empty-add-btn')?.addEventListener('click', this.addMonitor);
      return;
    }
    
    
    const sortedMonitors = [...this.state.monitors].sort((a, b) => {
      if (!a.active && b.active) return 1;
      if (a.active && !b.active) return -1;
      if (!a.isUp && b.isUp) return -1;
      if (a.isUp && !b.isUp) return 1;
      return 0;
    });
    
    
    sortedMonitors.forEach(monitor => {
      this.addMonitorToTable(monitor);
    });
  }

  
  addMonitorToTable(monitor) {
    const tableBody = document.getElementById('monitors-table-body') || document.getElementById('monitors-table');
    if (!tableBody) {
      console.error('Elemento da tabela de monitores não encontrado');
      return;
    }
    
    const monitorId = monitor.id || monitor._id;
    const row = document.createElement('tr');
    row.id = `monitor-row-${monitorId}`;
    row.className = monitor.active ? '' : 'table-secondary';
    
    
    let statusClass = 'status-unknown';
    let statusText = 'Desconhecido';
    let statusBadgeClass = 'bg-secondary';
    let statusIcon = 'bi-question-circle';
    
    if (monitor.active) {
      if (monitor.isUp === true) {
        statusClass = 'status-up';
        statusText = 'Operacional';
        statusBadgeClass = 'bg-success';
        statusIcon = 'bi-check-circle';
      } else if (monitor.isUp === false) {
        statusClass = 'status-down';
        statusText = 'Problema';
        statusBadgeClass = 'bg-danger';
        statusIcon = 'bi-exclamation-triangle';
      }
    } else {
      statusClass = 'status-paused';
      statusText = 'Pausado';
      statusBadgeClass = 'bg-warning';
      statusIcon = 'bi-pause-circle';
    }
    
    
    const showURLColumn = this.state.currentPage === 'monitors';
    
    row.innerHTML = `
      <td>
        <a href="/monitor/${monitorId}" class="fw-bold text-decoration-none">
          ${monitor.name}
        </a>
      </td>
      ${showURLColumn ? `<td class="text-truncate" style="max-width: 200px;">${monitor.url}</td>` : ''}
      <td>
        <span class="badge bg-primary">
          ${monitor.type.toUpperCase()}
          ${monitor.type === 'tcp' ? `:${monitor.port}` : ''}
        </span>
      </td>
      <td>
        <span class="badge ${statusBadgeClass}">
          <i class="bi ${statusIcon}"></i> ${statusText}
        </span>
      </td>
      <td>
        ${monitor.responseTime ? this.formatResponseTime(monitor.responseTime) : '-'}
      </td>
      <td>
        ${monitor.uptime ? `${monitor.uptime.toFixed(2)}%` : '-'}
      </td>
      <td>
        ${monitor.lastChecked ? this.formatDate(monitor.lastChecked) : 'Nunca'}
      </td>
      <td>
        <div class="btn-group btn-group-sm">
          <button type="button" class="btn btn-primary check-btn" data-id="${monitorId}" title="Verificar Agora">
            <i class="bi bi-arrow-clockwise"></i>
          </button>
          <button type="button" class="btn btn-secondary edit-btn" data-id="${monitorId}" title="Editar">
            <i class="bi bi-pencil"></i>
          </button>
          <button type="button" class="btn btn-${monitor.active ? 'warning' : 'success'} toggle-btn" data-id="${monitorId}" 
                  title="${monitor.active ? 'Pausar' : 'Ativar'}">
            <i class="bi bi-${monitor.active ? 'pause' : 'play'}"></i>
          </button>
          <button type="button" class="btn btn-danger delete-btn" data-id="${monitorId}" title="Excluir">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </td>
    `;
    
    tableBody.appendChild(row);
    
    
    row.querySelector('.check-btn').addEventListener('click', () => {
      this.checkMonitorNow(monitorId);
    });
    
    row.querySelector('.edit-btn').addEventListener('click', () => {
      this.editMonitor(monitor);
    });
    
    row.querySelector('.toggle-btn').addEventListener('click', () => {
      this.toggleMonitor(monitorId);
    });
    
    row.querySelector('.delete-btn').addEventListener('click', () => {
      this.deleteMonitor(monitorId);
    });
  }

  
  updateMonitorCounts() {
    if (this.state.currentPage !== 'dashboard') return;
    
    const upCount = document.getElementById('up-count');
    const downCount = document.getElementById('down-count');
    const pausedCount = document.getElementById('paused-count');
    const totalCount = document.getElementById('total-count');
    
    const counts = this.state.monitors.reduce((acc, monitor) => {
      if (!monitor.active) {
        acc.paused++;
      } else if (monitor.isUp === true) {
        acc.up++;
      } else if (monitor.isUp === false) {
        acc.down++;
      }
      return acc;
    }, { up: 0, down: 0, paused: 0 });
    
    upCount.textContent = counts.up;
    downCount.textContent = counts.down;
    pausedCount.textContent = counts.paused;
    totalCount.textContent = this.state.monitors.length;
  }

  
  updateMonitorInTable(monitor) {
    const row = document.getElementById(`monitor-row-${monitor._id}`);
    if (!row) return;
    
    
    row.remove();
    
    
    this.addMonitorToTable(monitor);
  }

  
  addMonitor() {
    
    document.getElementById('monitorModalTitle').textContent = 'Adicionar Monitor';
    document.getElementById('monitor-form').reset();
    document.getElementById('monitor-id').value = '';
    
    
    const monitorModal = new bootstrap.Modal(document.getElementById('monitorModal'));
    monitorModal.show();
    
    
    document.getElementById('monitor-form').onsubmit = (e) => {
      e.preventDefault();
      this.saveMonitor();
    };
    
    
    document.getElementById('monitor-type').addEventListener('change', (e) => {
      this.handleMonitorTypeChange(e.target.value);
    });
    
    
    this.handleMonitorTypeChange('http');
  }
  
  
  editMonitor(monitor) {
    
    document.getElementById('monitorModalTitle').textContent = 'Editar Monitor';
    
    
    document.getElementById('monitor-id').value = monitor._id;
    document.getElementById('monitor-name').value = monitor.name;
    document.getElementById('monitor-url').value = monitor.url;
    document.getElementById('monitor-type').value = monitor.type;
    document.getElementById('monitor-port').value = monitor.port || '';
    document.getElementById('monitor-interval').value = monitor.interval || 5;
    document.getElementById('monitor-timeout').value = monitor.timeout || 5;
    document.getElementById('monitor-status-code').value = monitor.expectedStatusCode || 200;
    document.getElementById('monitor-active').checked = monitor.active;
    
    
    this.handleMonitorTypeChange(monitor.type);
    
    
    const monitorModal = new bootstrap.Modal(document.getElementById('monitorModal'));
    monitorModal.show();
    
    
    document.getElementById('monitor-form').onsubmit = (e) => {
      e.preventDefault();
      this.saveMonitor();
    };
    
    
    document.getElementById('monitor-type').addEventListener('change', (e) => {
      this.handleMonitorTypeChange(e.target.value);
    });
  }
  
  
  handleMonitorTypeChange(type) {
    const portGroup = document.getElementById('port-group');
    const httpOnlyFields = document.querySelectorAll('.http-only');
    
    if (type === 'tcp') {
      portGroup.classList.remove('d-none');
      document.getElementById('monitor-port').setAttribute('required', 'required');
    } else {
      portGroup.classList.add('d-none');
      document.getElementById('monitor-port').removeAttribute('required');
    }
    
    if (type === 'http' || type === 'https') {
      httpOnlyFields.forEach(el => el.classList.remove('d-none'));
    } else {
      httpOnlyFields.forEach(el => el.classList.add('d-none'));
    }
  }
  
  
  async saveMonitor() {
    
    const id = document.getElementById('monitor-id').value;
    const monitorData = {
      name: document.getElementById('monitor-name').value,
      url: document.getElementById('monitor-url').value,
      type: document.getElementById('monitor-type').value,
      interval: parseInt(document.getElementById('monitor-interval').value, 10),
      timeout: parseInt(document.getElementById('monitor-timeout').value, 10),
      active: document.getElementById('monitor-active').checked
    };
    
    
    if (monitorData.type === 'tcp') {
      monitorData.port = parseInt(document.getElementById('monitor-port').value, 10);
    }
    
    if (monitorData.type === 'http' || monitorData.type === 'https') {
      monitorData.expectedStatusCode = parseInt(document.getElementById('monitor-status-code').value, 10);
    }
    
    try {
      let monitor;
      
      if (id) {
        
        monitor = await api.updateMonitor(id, monitorData);
        
        
        const index = this.state.monitors.findIndex(m => this.isSameMonitor(m._id, id));
        if (index !== -1) {
          this.state.monitors[index] = monitor;
        }
      } else {
        
        monitor = await api.createMonitor(monitorData);
        this.state.monitors.push(monitor);
      }
      
      
      const monitorModal = bootstrap.Modal.getInstance(document.getElementById('monitorModal'));
      monitorModal.hide();
      
      
      this.showToast(
        id ? 'Monitor atualizado' : 'Monitor adicionado', 
        `O monitor "${monitorData.name}" foi ${id ? 'atualizado' : 'adicionado'} com sucesso.`, 
        'success'
      );
      
      
      if (this.state.currentPage === 'dashboard' || this.state.currentPage === 'monitors') {
        this.renderMonitorsTable();
        this.updateMonitorCounts();
      } else if (this.state.currentPage === 'monitor-details' && this.isSameMonitor(this.state.currentMonitor._id, id)) {
        this.state.currentMonitor = monitor;
        this.renderMonitorDetails(monitor);
      }
    } catch (error) {
      this.showAlert('monitor-alert', error.message, 'danger');
      this.showToast('Erro', error.message, 'danger');
    }
  }
  
  
  async deleteMonitor(id) {
    const monitor = this.state.monitors.find(m => this.isSameMonitor(m.id, id) || this.isSameMonitor(m._id, id));
    if (!monitor) return;
    
    
    document.getElementById('delete-monitor-name').textContent = monitor.name;
    document.getElementById('confirm-delete-btn').setAttribute('data-monitor-id', id);
    
    
    const deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));
    deleteModal.show();
  }
  
  
  async confirmDeleteMonitor(id) {
    try {
      
      const deleteBtn = document.getElementById('confirm-delete-btn');
      if (deleteBtn) {
        deleteBtn.disabled = true;
        deleteBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Excluindo...';
      }
      
      try {
        await api.deleteMonitor(id);
        
        this.showToast('Monitor excluído', 'O monitor foi excluído com sucesso.', 'success');
      } catch (apiError) {
        
        if (apiError.message.includes('não encontrado')) {
          console.log('Monitor já excluído ou não existe mais');
          this.showToast('Monitor excluído', 'O monitor foi removido do sistema.', 'success');
        } else {
          
          throw apiError;
        }
      }
      
      
      this.state.monitors = this.state.monitors.filter(m => !this.isSameMonitor(m.id, id) && !this.isSameMonitor(m._id, id));
      
      
      const deleteModal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
      deleteModal.hide();
      
      
      if (this.state.currentPage === 'dashboard' || this.state.currentPage === 'monitors') {
        
        const row = document.getElementById(`monitor-row-${id}`);
        if (row) {
          
          row.classList.add('fade-out');
          
          
          setTimeout(() => {
            row.remove();
            
            this.renderMonitorsTable();
            this.updateMonitorCounts();
            this.renderIncidents();
          }, 500);
        } else {
          
          this.renderMonitorsTable();
          this.updateMonitorCounts();
          this.renderIncidents();
        }
      } else if (this.state.currentPage === 'monitor-details' && 
                (this.isSameMonitor(this.state.currentMonitor.id, id) || this.isSameMonitor(this.state.currentMonitor._id, id))) {
        this.navigate('/monitors');
      }
    } catch (error) {
      console.error('Erro ao excluir monitor:', error);
      this.showAlert('delete-alert', 'Erro ao excluir monitor: ' + error.message, 'danger');
      
      
      this.showToast('Erro', 'Erro ao excluir monitor: ' + error.message, 'danger');
    } finally {
      
      const deleteBtn = document.getElementById('confirm-delete-btn');
      if (deleteBtn) {
        deleteBtn.disabled = false;
        deleteBtn.innerHTML = 'Excluir';
      }
    }
  }
  
  
  isSameMonitor(id1, id2) {
    if (!id1 || !id2) return false;
    
    
    const strId1 = String(id1);
    const strId2 = String(id2);
    
    return strId1 === strId2;
  }
  
  
  async checkMonitorNow(id) {
    try {
      const result = await api.checkMonitor(id);
      
      
      const index = this.state.monitors.findIndex(m => this.isSameMonitor(m._id, id));
      if (index !== -1 && result.monitor) {
        this.state.monitors[index] = result.monitor;
        
        
        this.updateMonitorInTable(result.monitor);
        this.updateMonitorCounts();
        
        
        if (this.state.currentPage === 'monitor-details' && 
            this.isSameMonitor(this.state.currentMonitor._id, id)) {
          this.state.currentMonitor = result.monitor;
          this.renderMonitorDetails(result.monitor);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar monitor:', error);
      alert('Erro ao verificar monitor: ' + error.message);
    }
  }
  
  
  async toggleMonitor(id) {
    try {
      
      const toggleBtn = document.querySelector(`.toggle-btn[data-id="${id}"]`);
      if (toggleBtn) {
        const originalContent = toggleBtn.innerHTML;
        toggleBtn.disabled = true;
        toggleBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';
      }
      
      const result = await api.toggleMonitor(id);
      
      
      const index = this.state.monitors.findIndex(m => this.isSameMonitor(m.id, id) || this.isSameMonitor(m._id, id));
      if (index !== -1) {
        this.state.monitors[index] = result;
        
        
        const statusText = result.active ? 'ativado' : 'pausado';
        this.showToast(
          `Monitor ${statusText}`, 
          `O monitor "${result.name}" foi ${statusText} com sucesso.`, 
          result.active ? 'success' : 'warning'
        );
        
        
        const monitorId = result.id || result._id;
        const row = document.getElementById(`monitor-row-${monitorId}`);
        
        if (row) {
          
          row.remove();
          
          
          this.addMonitorToTable(result);
        } else {
          
          this.renderMonitorsTable();
        }
        
        
        this.updateMonitorCounts();
        
        
        if (this.state.currentPage === 'monitor-details' && 
            this.state.currentMonitor && 
            (this.isSameMonitor(this.state.currentMonitor.id, id) || this.isSameMonitor(this.state.currentMonitor._id, id))) {
          this.state.currentMonitor = result;
          this.renderMonitorDetails(result);
        }
      }
    } catch (error) {
      console.error('Erro ao alternar estado do monitor:', error);
      this.showToast('Erro', 'Erro ao alternar estado do monitor: ' + error.message, 'danger');
    } finally {
      
      const toggleBtn = document.querySelector(`.toggle-btn[data-id="${id}"]`);
      if (toggleBtn) {
        toggleBtn.disabled = false;
        const isActiveNow = this.state.monitors.find(m => (this.isSameMonitor(m.id, id) || this.isSameMonitor(m._id, id)))?.active;
        toggleBtn.innerHTML = `<i class="bi bi-${isActiveNow ? 'pause' : 'play'}"></i>`;
        toggleBtn.className = `btn btn-${isActiveNow ? 'warning' : 'success'} toggle-btn`;
        toggleBtn.title = isActiveNow ? 'Pausar' : 'Ativar';
      }
    }
  }
  
  
  renderMonitorDetails(monitor) {
    
    document.getElementById('detail-name').textContent = monitor.name;
    document.getElementById('detail-url').textContent = monitor.url;
    document.getElementById('detail-type').textContent = monitor.type.toUpperCase();
    
    
    const portDetail = document.querySelector('.port-detail');
    if (monitor.type === 'tcp') {
      portDetail.classList.remove('d-none');
      document.getElementById('detail-port').textContent = monitor.port;
    } else {
      portDetail.classList.add('d-none');
    }
    
    document.getElementById('detail-interval').textContent = `${monitor.interval} min`;
    document.getElementById('detail-active').textContent = monitor.active ? 'Sim' : 'Não';
    
    
    let statusClass = 'bg-secondary';
    let statusText = 'Desconhecido';
    
    if (monitor.active) {
      if (monitor.isUp === true) {
        statusClass = 'bg-success';
        statusText = 'Operacional';
      } else if (monitor.isUp === false) {
        statusClass = 'bg-danger';
        statusText = 'Problema';
      }
    } else {
      statusClass = 'bg-warning';
      statusText = 'Pausado';
    }
    
    const statusBadge = document.getElementById('detail-status-badge');
    statusBadge.className = `badge ${statusClass}`;
    statusBadge.textContent = statusText;
    
    
    document.getElementById('detail-uptime').textContent = monitor.uptime ? 
      `${monitor.uptime.toFixed(2)}%` : '0%';
    
    document.getElementById('detail-response-time').textContent = monitor.responseTime ? 
      this.formatResponseTime(monitor.responseTime) : '-';
    
    document.getElementById('detail-last-checked').textContent = monitor.lastChecked ? 
      this.formatDate(monitor.lastChecked) : 'Nunca';
    
    
    this.renderHistoryTable(monitor.history || []);
    
    
    this.renderResponseTimeChart(monitor.history || []);
  }
  
  
  renderHistoryTable(history) {
    const tableBody = document.getElementById('history-table-body');
    tableBody.innerHTML = '';
    
    if (history.length === 0) {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td colspan="5" class="text-center">
          Nenhum histórico disponível ainda.
        </td>
      `;
      tableBody.appendChild(row);
      return;
    }
    
    
    const sortedHistory = [...history].reverse();
    
    sortedHistory.slice(0, 20).forEach(entry => {
      const row = document.createElement('tr');
      
      let statusClass = 'text-secondary';
      let statusText = 'Desconhecido';
      
      if (entry.isUp === true) {
        statusClass = 'text-success';
        statusText = 'UP';
      } else if (entry.isUp === false) {
        statusClass = 'text-danger';
        statusText = 'DOWN';
      }
      
      row.innerHTML = `
        <td>${this.formatDate(entry.timestamp)}</td>
        <td class="${statusClass}"><strong>${statusText}</strong></td>
        <td>${entry.responseTime ? this.formatResponseTime(entry.responseTime) : '-'}</td>
        <td>${entry.statusCode || '-'}</td>
        <td class="text-truncate" style="max-width: 200px;">${entry.error || '-'}</td>
      `;
      
      tableBody.appendChild(row);
    });
  }
  
  
  renderResponseTimeChart(history) {
    const canvas = document.getElementById('response-time-chart');
    
    
    if (this.responseTimeChart) {
      this.responseTimeChart.destroy();
    }
    
    if (history.length === 0) {
      return;
    }
    
    
    const chartData = history.slice(-20).map(entry => ({
      timestamp: new Date(entry.timestamp),
      responseTime: entry.responseTime,
      isUp: entry.isUp
    }));
    
    const labels = chartData.map(data => {
      const date = new Date(data.timestamp);
      return date.toLocaleTimeString();
    });
    
    const data = chartData.map(data => data.responseTime);
    
    
    const config = {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Tempo de Resposta (ms)',
          data: data,
          borderColor: 'rgba(52, 152, 219, 1)',
          backgroundColor: 'rgba(52, 152, 219, 0.1)',
          tension: 0.1,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Tempo (ms)'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Horário'
            }
          }
        }
      }
    };
    
    
    this.responseTimeChart = new Chart(canvas, config);
  }
  
  
  async handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
      const result = await api.login(email, password);
      
      
      this.state.user = result.user;
      
      
      this.elements.username.textContent = result.user.name;
      this.elements.authButtons.classList.add('d-none');
      this.elements.userMenu.classList.remove('d-none');
      
      
      const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
      modal.hide();
      
      
      await this.loadMonitors();
      
      
      this.navigate('/');
    } catch (error) {
      this.showAlert('login-alert', error.message);
    }
  }
  
  
  async handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    
    try {
      const result = await api.register(name, email, password);
      
      
      this.state.user = result.user;
      
      
      this.elements.username.textContent = result.user.name;
      this.elements.authButtons.classList.add('d-none');
      this.elements.userMenu.classList.remove('d-none');
      
      
      const modal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
      modal.hide();
      
      
      this.navigate('/');
    } catch (error) {
      this.showAlert('register-alert', error.message);
    }
  }
  
  
  async handleLogout(e) {
    e.preventDefault();
    
    try {
      await api.logout();
      
      
      this.state.user = null;
      this.state.monitors = [];
      this.state.currentMonitor = null;
      
      
      this.elements.authButtons.classList.remove('d-none');
      this.elements.userMenu.classList.add('d-none');
      
      
      this.navigate('/');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  }
  
  
  showAlert(elementId, message, type = 'danger') {
    const alertElement = document.getElementById(elementId);
    
    if (!alertElement) return;
    
    
    let icon = 'exclamation-triangle';
    if (type === 'success') icon = 'check-circle';
    else if (type === 'warning') icon = 'exclamation-circle';
    else if (type === 'info') icon = 'info-circle';
    
    alertElement.className = `alert alert-${type} d-flex align-items-center`;
    alertElement.innerHTML = `
      <i class="bi bi-${icon} me-2"></i>
      <div>${message}</div>
    `;
    
    alertElement.classList.remove('d-none');
    
    
    if (type !== 'danger') {
      setTimeout(() => {
        this.hideAlert(elementId);
      }, 5000);
    }
  }
  
  
  hideAlert(elementId) {
    const alertElement = document.getElementById(elementId);
    alertElement.classList.add('d-none');
  }
  
  
  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString();
  }
  
  
  formatResponseTime(timeMs) {
    if (timeMs < 1000) {
      return `${timeMs.toFixed(0)} ms`;
    } else {
      return `${(timeMs / 1000).toFixed(2)} s`;
    }
  }

  
  renderIncidents(showAll = false) {
    const incidentsContainer = document.getElementById('incidents-container');
    if (!incidentsContainer) return;
    
    
    const incidents = [];
    
    this.state.monitors.forEach(monitor => {
      if (!monitor.active) return;
      
      if (monitor.isUp === false) {
        
        const incidentId = `down_${monitor.id || monitor._id}_${new Date(monitor.lastChecked).getTime()}`;
        incidents.push({
          _id: monitor.id || monitor._id,
          incidentId: incidentId,
          name: monitor.name,
          url: monitor.url,
          timestamp: monitor.lastChecked,
          type: 'down',
          resolved: false,
          isRead: this.isIncidentRead(incidentId)
        });
      } else if (monitor.history && monitor.history.length >= 2) {
        
        const recentHistory = monitor.history.slice(0, 10);
        for (let i = 0; i < recentHistory.length - 1; i++) {
          const current = recentHistory[i];
          const next = recentHistory[i + 1];
          
          if (current.isUp && !next.isUp) {
            
            const incidentTime = new Date(next.timestamp || next.createdAt);
            const now = new Date();
            const hoursDiff = (now - incidentTime) / (1000 * 60 * 60);
            
            if (hoursDiff <= 24) {
              const incidentId = `recovered_${monitor.id || monitor._id}_${incidentTime.getTime()}`;
              incidents.push({
                _id: monitor.id || monitor._id,
                incidentId: incidentId,
                name: monitor.name,
                url: monitor.url,
                timestamp: next.timestamp || next.createdAt,
                type: 'recovered',
                resolved: true,
                isRead: this.isIncidentRead(incidentId)
              });
              break; 
            }
          }
        }
      }
    });
    
    if (incidents.length === 0) {
      incidentsContainer.innerHTML = `
        <div class="text-center py-4">
          <i class="bi bi-check-circle text-success fs-1"></i>
          <p class="mt-2">Nenhum incidente recente!</p>
        </div>
      `;
      return;
    }
    
    
    incidents.sort((a, b) => {
      if (a.resolved !== b.resolved) {
        return a.resolved ? 1 : -1;
      }
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
    
    
    const uniqueIncidents = incidents.filter((incident, index, self) => 
      index === self.findIndex(i => i.incidentId === incident.incidentId)
    );
    
    
    let displayIncidents = uniqueIncidents;
    if (!showAll && this.state.currentPage === 'dashboard') {
      displayIncidents = uniqueIncidents.filter(incident => !incident.isRead);
    }
    
    
    if (displayIncidents.length === 0) {
      if (uniqueIncidents.length > 0) {
        
        incidentsContainer.innerHTML = `
          <div class="text-center py-4">
            <i class="bi bi-check-circle text-success fs-1"></i>
            <p class="mt-2">Todos os incidentes foram marcados como lidos.</p>
            <button id="clear-read-incidents" class="btn btn-sm btn-outline-primary mt-2">
              Mostrar todos os incidentes
            </button>
          </div>
        `;
      } else {
        
        incidentsContainer.innerHTML = `
          <div class="text-center py-4">
            <i class="bi bi-check-circle text-success fs-1"></i>
            <p class="mt-2">Nenhum incidente recente!</p>
          </div>
        `;
      }
      return;
    }
    
    
    let headerHtml = '';
    if (showAll && uniqueIncidents.some(i => i.isRead)) {
      headerHtml = `
        <div class="d-flex justify-content-end mb-3">
          <button id="clear-read-incidents" class="btn btn-sm btn-outline-primary">
            Limpar incidentes lidos
          </button>
        </div>
      `;
    } else if (!showAll && this.state.readIncidents.length > 0) {
      headerHtml = `
        <div class="d-flex justify-content-end mb-3">
          <button id="clear-read-incidents" class="btn btn-sm btn-outline-primary">
            Mostrar todos os incidentes
          </button>
        </div>
      `;
    }
    
    const incidentsHtml = displayIncidents.map(incident => `
      <div class="incident-item ${incident.resolved ? 'resolved' : ''} ${incident.isRead ? 'opacity-75' : ''}">
        <div class="incident-actions">
          <button class="mark-read-btn" data-incident-id="${incident.incidentId}" title="${incident.isRead ? 'Já marcado como lido' : 'Marcar como lido'}">
            <i class="bi ${incident.isRead ? 'bi-check-circle-fill' : 'bi-check-circle'}"></i>
          </button>
        </div>
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <h5 class="mb-1">
              ${incident.resolved ? 
                '<i class="bi bi-arrow-up-circle text-success"></i>' : 
                '<i class="bi bi-exclamation-circle text-danger"></i>'
              }
              ${incident.name}
            </h5>
            <p class="mb-1">${incident.url}</p>
            <span class="incident-time">
              ${this.formatDate(incident.timestamp)}
            </span>
          </div>
          <a href="/monitor/${incident._id}" class="btn btn-sm btn-outline-primary">
            Detalhes
          </a>
        </div>
      </div>
    `).join('');
    
    incidentsContainer.innerHTML = headerHtml + incidentsHtml;
  }

  
  updateNavigation() {
    
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
    });

    
    if (this.state.currentPage === 'dashboard') {
      document.getElementById('nav-dashboard')?.classList.add('active');
    } else if (this.state.currentPage === 'monitors') {
      document.getElementById('nav-monitors')?.classList.add('active');
    }
  }

  
  updateUI() {
    
    if (this.state.currentPage === 'dashboard' || this.state.currentPage === 'monitors') {
      this.renderMonitorsTable();
      this.updateMonitorCounts();
    }
    
    
    if (this.state.currentPage === 'dashboard') {
      this.renderIncidents();
    }
    
    
    if (this.state.currentPage === 'monitor-details' && this.state.currentMonitor) {
      const monitor = this.state.monitors.find(m => 
        this.isSameMonitor(m.id, this.state.currentMonitor.id) || this.isSameMonitor(m._id, this.state.currentMonitor._id));
      
      if (monitor) {
        this.renderMonitorDetails(monitor);
        this.renderHistoryTable(monitor.history || []);
        this.renderResponseTimeChart(monitor.history || []);
      }
    }
  }
  
  
  updateLastUpdatedTime() {
    this.state.lastUpdated = new Date();
    
    
    const lastUpdatedElement = document.getElementById('last-updated-time');
    if (lastUpdatedElement) {
      lastUpdatedElement.textContent = this.formatDate(this.state.lastUpdated);
    }
  }
  
  
  async checkAllMonitors() {
    try {
      const checkAllBtn = document.getElementById('check-all-monitors');
      if (checkAllBtn) {
        checkAllBtn.disabled = true;
        checkAllBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Verificando...';
      }
      
      await api.checkAllMonitors();
      
      if (checkAllBtn) {
        setTimeout(() => {
          checkAllBtn.disabled = false;
          checkAllBtn.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Verificar todos';
        }, 2000);
      }
    } catch (error) {
      console.error('Erro ao verificar todos os monitores:', error);
      alert('Erro ao verificar monitores: ' + error.message);
      
      if (checkAllBtn) {
        checkAllBtn.disabled = false;
        checkAllBtn.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Verificar todos';
      }
    }
  }
  
  
  showToast(title, message, type = 'primary') {
    const toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) return;
    
    const toast = document.createElement('div');
    toast.className = `toast show`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    toast.innerHTML = `
      <div class="toast-header">
        <strong class="me-auto">${title}</strong>
        <small>${this.formatDate(new Date())}</small>
        <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
      <div class="toast-body ${type ? 'bg-' + type + '-subtle' : ''}">
        ${message}
      </div>
    `;
    
    toastContainer.appendChild(toast);
    
    
    const bsToast = new bootstrap.Toast(toast, {
      delay: 5000
    });
    
    
    toast.addEventListener('hidden.bs.toast', () => {
      toast.remove();
    });
    
    bsToast.show();
  }
} 


