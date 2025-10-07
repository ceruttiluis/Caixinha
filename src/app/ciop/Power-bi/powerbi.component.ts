/*import { Component, AfterViewInit, ElementRef, ViewChild, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { SidebarCiopComponent } from '../shared-ciop/sidebar.component';
import { Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { SharedModule } from '../../shared/shared.module';
import { PowerBIService, EmbedConfig } from '../../services/powerbi.service';

import type * as PBI from 'powerbi-client';
import type * as Models from 'powerbi-models';

@Component({
  selector: 'app-powerbi-ciop',
  templateUrl: './powerbi.component.html',
  styleUrls: ['./powerbi.component.scss'],
  standalone: true,
  imports: [
    SidebarCiopComponent,
    SharedModule,
    HttpClientModule,
    CommonModule,
]
})
export class PowerBiComponent implements AfterViewInit {
   @ViewChild('reportContainer', { static: false }) reportContainer!: ElementRef<HTMLDivElement>;
  isBrowser = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    private pbiSvc: PowerBIService,
     @Inject(PLATFORM_ID) private platformId: Object
  ) {this.isBrowser = isPlatformBrowser(this.platformId);}

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

    async ngAfterViewInit() {
    if (!this.isBrowser) return; // não executa no SSR

    // ⬇️ imports dinâmicos para o runtime (browser)
  const [pbi, models] = await Promise.all([
    import('powerbi-client'),
    import('powerbi-models')
  ]) as [typeof import('powerbi-client'), typeof import('powerbi-models')];

    this.pbiSvc.getEmbedConfig().subscribe((cfg: EmbedConfig) => {
      const service = new pbi.service.Service(
        pbi.factories.hpmFactory,
        pbi.factories.wpmpFactory,
        pbi.factories.routerFactory
      );

      // ⬇️ use os tipos vindos dos IMPORTS-DE-TIPO (PBI/Models)
      const embedConfig: PBI.IEmbedConfiguration = {
        type: 'report',
        id: cfg.reportId,
        embedUrl: cfg.embedUrl,
        accessToken: cfg.embedToken,
        tokenType: models.TokenType.Embed,
        permissions: models.Permissions.All,
        settings: {
          panes: { filters: { visible: false }, pageNavigation: { visible: true } },
          background: models.BackgroundType.Transparent
        }
      };

      const report = service.embed(
        this.reportContainer.nativeElement,
        embedConfig
      ) as PBI.Report;

      report.on('loaded', () => console.log('Power BI carregado'));
      report.on('error', (e: unknown) => console.error('Power BI error', e)); // tipa o 'e'
    });
  }
}*/

import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarCiopComponent } from '../shared-ciop/sidebar.component';

@Component({
  selector: 'app-powerbi-simple',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarCiopComponent],
  templateUrl: './powerbi.component.html',
  styleUrls: ['./powerbi.component.scss'],
})
export class PowerBiComponent implements OnInit {
  embedUrl!: SafeResourceUrl;

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    const raw = 'https://app.powerbi.com/view?r=eyJrIjoiYWFmYTkzOWItNWVkMC00OTE3LWE2NzktZGY0MzFlNmY3YzI4IiwidCI6IjRmODUzZjYzLTBlNjUtNGU0Ny05M2Q4LTFhMjk3YzQxODRmOCJ9';
    this.embedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(raw);
  }
}
