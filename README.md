# Dobi Protocol - IoT Web3 Interface

Una interfaz web moderna y responsive para conectar dispositivos IoT con la blockchain a través del protocolo Dobi.

##  Características

- ** Autenticación Web3**: Conexión segura con MetaMask
- ** Diseño Responsive**: Optimizado para móviles, tablets y desktop
- ** Gestión de Dispositivos**: Crear, ver y gestionar dispositivos IoT
- ** Transacciones Blockchain**: Visualizar transacciones en tiempo real
- ** UI Moderna**: Interfaz intuitiva con componentes reutilizables
- **    Performance**: Carga rápida y navegación fluida

## Arquitectura

### Frontend (Solo HTML/CSS/JS)
- **HTML5**: Estructura semántica y accesible
- **CSS3**: Variables CSS, Grid, Flexbox, animaciones
- **JavaScript ES6+**: Módulos, clases, async/await
- **Sin Frameworks**: Código vanilla para máxima compatibilidad

### Estructura de Archivos
```
public/
├── index.html              # Página principal
├── styles/
│   ├── main.css           # Estilos base y layout
│   ├── components.css     # Componentes UI
│   ├── forms.css          # Estilos de formularios
│   └── responsive.css     # Media queries y responsive
├── js/
│   ├── web3.js           # Integración Web3/MetaMask
│   ├── auth.js           # Autenticación y autorización
│   ├── devices.js        # Gestión de dispositivos
│   ├── transactions.js   # Gestión de transacciones
│   ├── ui.js             # Navegación y UI
│   └── app.js            # Aplicación principal
```

## Instalación y Uso

### 1. Clonar el Repositorio
```bash
git clone <repository-url>
cd dobi-web3-interface
```

### 2. Instalar Dependencias
```bash
npm install
```

### 3. Ejecutar la Aplicación
```bash
# Modo desarrollo
npm run dev

# Modo producción
npm start
```

### 4. Abrir en el Navegador
```
http://localhost:3000
```

## 🔧 Configuración

### MetaMask
1. Instalar la extensión MetaMask en tu navegador
2. Crear o importar una wallet
3. Conectar a la red deseada (Ethereum, Polygon, BSC, etc.)

### Variables de Entorno
Crear un archivo `.env` en la raíz del proyecto:
```env
PORT=3000
NODE_ENV=development
```

## 📱 Funcionalidades

### Página Principal
- **Hero Section**: Introducción al protocolo Dobi
- **Estadísticas**: Contadores de dispositivos, transacciones y usuarios
- **Dispositivos Recientes**: Vista previa de los últimos dispositivos creados

### Autenticación
- **Conexión Wallet**: Integración nativa con MetaMask
- **Firma de Mensajes**: Autenticación criptográfica segura
- **Gestión de Sesión**: Persistencia de autenticación

### Gestión de Dispositivos
- **Crear Dispositivo**: Formulario completo con validación
- **Lista de Dispositivos**: Vista en grid con información detallada
- **Detalle del Dispositivo**: Modal con información completa
- **Eliminar Dispositivo**: Gestión del ciclo de vida

### Transacciones Blockchain
- **Lista de Transacciones**: Historial cronológico
- **Estado de Transacciones**: Confirmadas, pendientes, fallidas
- **Exploradores**: Enlaces directos a block explorers
- **Copia de Hash**: Funcionalidad de clipboard

## Componentes UI

### Botones
- **Primario**: Acciones principales
- **Secundario**: Acciones secundarias
- **Éxito/Error/Advertencia**: Estados específicos
- **Tamaños**: Grande, normal, pequeño

### Tarjetas
- **Dispositivos**: Información visual con fotos
- **Transacciones**: Detalles estructurados
- **Estadísticas**: Métricas destacadas

### Formularios
- **Validación**: Campos requeridos y formatos
- **Estados**: Loading, éxito, error
- **Responsive**: Adaptación a diferentes pantallas

### Modales
- **Detalle de Dispositivo**: Información completa
- **Confirmaciones**: Acciones destructivas
- **Responsive**: Adaptación móvil

## Responsive Design

### Breakpoints
- **Mobile**: ≤ 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Características
- **Navegación Móvil**: Menú hamburguesa con gestos
- **Grid Adaptativo**: Columnas que se ajustan automáticamente
- **Tipografía Escalable**: Tamaños de fuente responsivos
- **Touch Friendly**: Botones y elementos táctiles

## Seguridad

### Autenticación
- **Nonce Único**: Prevención de replay attacks
- **Firma Criptográfica**: Verificación de identidad
- **Expiración de Sesión**: Timeout automático

### Validación
- **Frontend**: Validación en tiempo real
- **Backend**: Verificación de datos
- **Sanitización**: Prevención de XSS

## Performance

### Optimizaciones
- **Lazy Loading**: Carga bajo demanda
- **Debouncing**: Optimización de eventos
- **Caching**: Almacenamiento local inteligente
- **Minificación**: Archivos optimizados

### Monitoreo
- **Performance API**: Métricas de carga
- **Long Tasks**: Detección de bloqueos
- **Error Tracking**: Captura de errores

## Testing

### Funcionalidades
- **Navegación**: Cambio entre páginas
- **Formularios**: Validación y envío
- **Responsive**: Diferentes tamaños de pantalla
- **Web3**: Conexión de wallet

### Navegadores Soportados
- **Chrome**: Versión 80+
- **Firefox**: Versión 75+
- **Safari**: Versión 13+
- **Edge**: Versión 80+

## API Endpoints

### Autenticación
- `GET /api/auth/nonce/:address` - Obtener nonce para autenticación
- `POST /api/auth/verify` - Verificar firma y autenticar

### Dispositivos
- `GET /api/devices` - Listar todos los dispositivos
- `GET /api/devices/:id` - Obtener dispositivo específico
- `POST /api/devices` - Crear nuevo dispositivo
- `DELETE /api/devices/:id` - Eliminar dispositivo

### Transacciones
- `GET /api/transactions` - Listar transacciones
- `POST /api/transactions` - Registrar nueva transacción

## Futuras Mejoras

### Funcionalidades
- **Dashboard Avanzado**: Métricas y gráficos
- **Notificaciones Push**: Alertas en tiempo real
- **Multi-wallet**: Soporte para múltiples wallets
- **Offline Mode**: Funcionalidad sin conexión

### Técnicas
- **Service Workers**: Caching avanzado
- **WebAssembly**: Cálculos complejos
- **WebRTC**: Comunicación P2P
- **Progressive Web App**: Instalación nativa

## Contribución

### Guías de Estilo
- **JavaScript**: ES6+, async/await, módulos
- **CSS**: Variables CSS, BEM methodology
- **HTML**: Semántico, accesible, SEO-friendly

### Proceso
1. Fork del repositorio
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## Licencia

Este proyecto está bajo la licencia MIT. Ver el archivo `LICENSE` para más detalles.

## Soporte

### Documentación
- **README**: Este archivo
- **Comentarios**: Código documentado
- **Console Logs**: Información de debug

### Contacto
- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Wiki**: Documentación adicional

## Agradecimientos

- **MetaMask**: Integración Web3
- **Font Awesome**: Iconos
- **CSS Grid/Flexbox**: Layout moderno
- **ES6+**: JavaScript moderno

---

**Dobi Protocol** - Conectando IoT con Blockchain 
