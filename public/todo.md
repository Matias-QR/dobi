# TODO - Dobi Protocol Web3 IoT Interface

## Frontend (Completado ✅)
- [x] js, html plano con subdivisión de archivos
- [x] Interfaz: nombre, dispositivo, endpoint de monitoreo y de acciones
- [x] Home: poder ver una lista de los dispositivos creados
- [x] Vista para ver las ultimas transacciones en la blockchain
- [x] Navegación entre páginas (crear instancia de dobi, ver tu dispositivo, ver el detalle de tu instancia de dobi)
- [x] Estructura modular de archivos (HTML, CSS, JS)
- [x] Diseño responsive y moderno
- [x] Componentes UI reutilizables

## Backend
- [ ] Login simple con Metamask que tenga validación del backend (node.js) para firmar el mensaje en el sign in
- [ ] API endpoints para autenticación
- [ ] Validación de firmas de mensajes
- [ ] Middleware de seguridad
- [ ] Manejo de sesiones de usuario

## Base de Datos
- [ ] bbdd para guardar todo, sqlite 3
- [ ] Esquema de base de datos
- [ ] Tablas: usuarios, dispositivos, transacciones
- [ ] Migraciones y seeders
- [ ] Conexión y configuración de SQLite3

## Funcionalidades Core
- [ ] Integración completa con Web3/MetaMask
- [ ] Creación y gestión de dispositivos IoT
- [ ] Monitoreo de dispositivos en tiempo real
- [ ] Ejecución de acciones en dispositivos
- [ ] Sistema de logs y auditoría
- [ ] Gestión de transacciones blockchain

## Características de Dispositivos
- [ ] Almacenamiento de nombre, descripción, foto, address
- [ ] Gestión de endpoints de monitoreo
- [ ] Gestión de endpoints de acciones
- [ ] Validación de direcciones Ethereum
- [ ] Subida y gestión de imágenes

## Seguridad y Validación
- [ ] Validación de entrada de formularios
- [ ] Sanitización de datos
- [ ] Autenticación JWT o similar
- [ ] Rate limiting
- [ ] Validación de permisos de usuario

## Deployment y DevOps 
- [ ] Configuración de entorno de producción
- [ ] Scripts de deployment
- [ ] Configuración de servidor
- [ ] SSL/HTTPS
- [ ] Monitoreo y logging en producción

## Próximos Pasos Recomendados
1. Implementar backend con Node.js y Express
2. Configurar base de datos SQLite3
3. Implementar autenticación con MetaMask
4. Crear API endpoints para dispositivos
5. Integrar frontend con backend
