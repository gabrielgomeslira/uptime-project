
class ApiClient {
  constructor() {
    this.baseUrl = '/api';
  }

  
  async request(endpoint, method = 'GET', data = null) {
    const url = `${this.baseUrl}${endpoint}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'same-origin'
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        const json = await response.json();
        
        if (!response.ok) {
          throw new Error(json.error || 'Erro desconhecido');
        }
        
        return json;
      }
      
      if (!response.ok) {
        throw new Error('Erro na requisiÃ§Ã£o');
      }
      
      return null;
    } catch (error) {
      console.error('Erro na API:', error);
      throw error;
    }
  }

  

  
  async register(name, email, password) {
    return this.request('/auth/register', 'POST', { name, email, password });
  }

  
  async login(email, password) {
    return this.request('/auth/login', 'POST', { email, password });
  }

  
  async logout() {
    return this.request('/auth/logout', 'POST');
  }

  
  async getCurrentUser() {
    return this.request('/auth/me', 'GET');
  }

  

  
  async getMonitors() {
    return this.request('/monitors', 'GET');
  }

  
  async getMonitor(id) {
    return this.request(`/monitors/${id}`, 'GET');
  }

  
  async createMonitor(monitorData) {
    return this.request('/monitors', 'POST', monitorData);
  }

  
  async updateMonitor(id, monitorData) {
    return this.request(`/monitors/${id}`, 'PUT', monitorData);
  }

  
  async deleteMonitor(id) {
    return this.request(`/monitors/${id}`, 'DELETE');
  }

  
  async checkMonitor(id) {
    return this.request(`/monitors/${id}/check`, 'POST');
  }

  
  async checkAllMonitors() {
    return this.request('/monitors/check-all', 'POST');
  }

  
  async toggleMonitor(id) {
    return this.request(`/monitors/${id}/toggle`, 'PATCH');
  }
}

const api = new ApiClient(); 


