import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface EmbedConfig {
  reportId: string;
  embedUrl: string;
  embedToken: string;
  tokenExpiry: string;
}

@Injectable({ providedIn: 'root' })
export class PowerBIService {
  constructor(private http: HttpClient) {}

  getEmbedConfig() {
    return this.http.get<EmbedConfig>('/api/powerbi/embed-config');
  }
}
