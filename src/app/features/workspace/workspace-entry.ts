import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AccessContext } from '../../core/auth/access-context';
import { Session } from '../../core/auth/session';

@Component({
  selector: 'app-workspace-entry',
  template: '',
})
export class WorkspaceEntry {
  private readonly access = inject(AccessContext);
  private readonly router = inject(Router);
  private readonly session = inject(Session);

  constructor() {
    void this.openWorkspace();
  }

  private async openWorkspace(): Promise<void> {
    try {
      const roles = await this.access.load();
      const role = this.access.activeRole();
      if (!role || roles.length === 0) {
        this.session.clear();
        await this.router.navigateByUrl('/login', { replaceUrl: true });
        return;
      }
      await this.router.navigateByUrl(roleRoute[role], { replaceUrl: true });
    } catch {
      this.session.clear();
      await this.router.navigateByUrl('/sessao-expirada', { replaceUrl: true });
    }
  }
}

const roleRoute = {
  Admin: '/inicio/admin',
  Nutritionist: '/inicio/nutricionista',
  Patient: '/inicio/paciente',
} as const;
