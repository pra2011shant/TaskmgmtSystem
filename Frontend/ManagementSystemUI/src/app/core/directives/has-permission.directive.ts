import { Directive, Input, TemplateRef, ViewContainerRef, inject, effect } from '@angular/core';
import { AuthService } from '../services/auth.service';

@Directive({
  selector: '[hasPermission]',
  standalone: true
})
export class HasPermissionDirective {
  private authService = inject(AuthService);
  private templateRef = inject(TemplateRef<any>);
  private viewContainer = inject(ViewContainerRef);

  private requiredPermission = '';
  private isRendered = false;

  @Input() set hasPermission(permission: string) {
    this.requiredPermission = permission;
    this.updateView();
  }

  constructor() {
    effect(() => {
      // Re-evaluate whenever user permissions signal or role changes
      this.authService.permissions();
      this.authService.currentUser();
      this.updateView();
    });
  }

  private updateView(): void {
    if (!this.requiredPermission) {
      if (!this.isRendered) {
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.isRendered = true;
      }
      return;
    }

    const hasAccess = this.authService.hasPermission(this.requiredPermission);

    if (hasAccess && !this.isRendered) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.isRendered = true;
    } else if (!hasAccess && this.isRendered) {
      this.viewContainer.clear();
      this.isRendered = false;
    }
  }
}
