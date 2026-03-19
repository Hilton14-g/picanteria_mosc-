import { Routes } from '@angular/router';
import { MesasComponent } from './components/mesas/mesas.component';
import { NuevoPedidoComponent } from './components/nuevo-pedido/nuevo-pedido.component';
import { CocinaComponent } from './components/cocina/cocina.component';
import { QrAdminComponent } from './components/qr-admin/qr-admin.component';
import { UsuarioListComponent } from './components/usuario-list/usuario-list.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { MesaCuentaComponent } from './components/mesa-cuenta/mesa-cuenta.component';
import { RecuperarContrasenaComponent } from './components/recuperar-contrasena/recuperar-contrasena.component';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { 
    path: 'mesas', 
    component: MesasComponent
  },
  { 
    path: 'mesas/:mesaId', 
    component: MesasComponent
  },
  { 
    path: 'nuevo-pedido/:mesaId', 
    component: NuevoPedidoComponent
  },
  { 
    path: 'cocina', 
    component: CocinaComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { expectedRoles: ['ROLE_ADMIN', 'ROLE_COCINA', 'ROLE_COCINERO'] }
  },
  { 
    path: 'admin/qr', 
    component: QrAdminComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { expectedRoles: ['ROLE_ADMIN'] }
  },
  { 
    path: 'admin/usuarios', 
    component: UsuarioListComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { expectedRoles: ['ROLE_ADMIN'] }
  },
  { 
    path: 'recuperar-contrasena', 
    component: RecuperarContrasenaComponent
  },
  { 
    path: 'mesa-cuenta/:mesaId', 
    component: MesaCuentaComponent
  },
  { path: '**', redirectTo: 'login' }
];