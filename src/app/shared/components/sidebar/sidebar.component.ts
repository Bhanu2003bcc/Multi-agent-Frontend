import { Component, computed, signal, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

interface NavItem {
  label: string;
  path: string;
  icon: string;
  adminOnly?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  private readonly authService = inject(AuthService);

  readonly currentUser = this.authService.currentUser;
  readonly isAdmin = this.authService.isAdmin;
  collapsed = signal(false);

  readonly navItems: NavItem[] = [
    { label: 'Dashboard',    path: '/dashboard',         icon: 'grid' },
    { label: 'New Research', path: '/research/new',      icon: 'search' },
    { label: 'History',      path: '/research/history',  icon: 'clock' },
  ];

  readonly visibleItems = computed(() =>
    this.navItems.filter(item => !item.adminOnly || this.isAdmin())
  );

  toggleCollapse(): void { this.collapsed.update(c => !c); }
  logout(): void { this.authService.logout(); }
}
