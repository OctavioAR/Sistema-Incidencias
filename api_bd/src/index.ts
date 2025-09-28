import express from 'express';
import cors from 'cors';
import { query, execute } from './database';

const app = express();
const PUERTO = 3001;

const requireJefeTaller = (req: any, res: any, next: any) => {
  const usuarioId = req.headers['usuario-id'] || req.query.usuarioId;
  
  if (!usuarioId) {
    res.status(401).json({ error: 'Usuario no autenticado' });
    return;
  }
  
  const verificarPermisos = async () => {
    try {
      const usuarios = await query(`
        SELECT u.*, t.nombre as tipo_usuario 
        FROM Usuario u 
        JOIN TipoUsuario t ON u.idTipoUsuario = t.idTipoUsuario 
        WHERE u.idUsuario = ? AND u.activo = 1
      `, [usuarioId]);
      
      if (usuarios.length === 0 || usuarios[0].tipo_usuario !== 'Jefe de Taller') {
        res.status(403).json({ error: 'No tienes permisos para realizar esta acción' });
        return;
      }
      
      req.usuario = usuarios[0];
      next();
    } catch (error) {
      res.status(500).json({ error: 'Error al verificar permisos' });
    }
  };
  
  verificarPermisos();
};

app.use(cors());
app.use(express.json());


// EDIFICIOS
app.get('/edificios', async (_req, res) => {
  try {
    const edificios = await query('SELECT * FROM Edificio ORDER BY nombre');
    res.json(edificios);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener edificios' });
  }
});

app.post('/edificios', requireJefeTaller, async (req, res) => {
  try {
    const { codigo, nombre } = req.body;
    
    const result = await execute(
      'INSERT INTO Edificio (codigo, nombre) VALUES (?, ?)',
      [codigo, nombre]
    );
    
    res.status(201).json({ 
      message: 'Edificio creado correctamente', 
      id: result.insertId 
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear edificio' });
  }
});

app.put('/edificios/:id', requireJefeTaller, async (req, res) => {
  try {
    const { id } = req.params;
    const { codigo, nombre } = req.body;
    
    await execute(
      'UPDATE Edificio SET codigo = ?, nombre = ? WHERE idEdificio = ?',
      [codigo, nombre, id]
    );
    
    res.json({ message: 'Edificio actualizado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar edificio' });
  }
});

app.delete('/edificios/:id', requireJefeTaller, async (req, res) => {
  try {
    const { id } = req.params;
    
    await execute('DELETE FROM Edificio WHERE idEdificio = ?', [id]);
    
    res.json({ message: 'Edificio eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar edificio' });
  }
});

// AULAS
app.get('/aulas', async (_req, res) => {
  try {
    const aulas = await query(`
      SELECT a.*, e.nombre as edificio_nombre 
      FROM Aula a 
      LEFT JOIN Edificio e ON a.idEdificio = e.idEdificio 
      ORDER BY a.nombre
    `);
    res.json(aulas);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener aulas' });
  }
});

app.post('/aulas', requireJefeTaller, async (req, res) => {
  try {
    const { codigo, nombre, idEdificio } = req.body;
    
    const result = await execute(
      'INSERT INTO Aula (codigo, nombre, idEdificio) VALUES (?, ?, ?)',
      [codigo, nombre, idEdificio]
    );
    
    res.status(201).json({ 
      message: 'Aula creada correctamente', 
      id: result.insertId 
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear aula' });
  }
});

app.put('/aulas/:id', requireJefeTaller, async (req, res) => {
  try {
    const { id } = req.params;
    const { codigo, nombre, idEdificio } = req.body;
    
    await execute(
      'UPDATE Aula SET codigo = ?, nombre = ?, idEdificio = ? WHERE idAula = ?',
      [codigo, nombre, idEdificio, id]
    );
    
    res.json({ message: 'Aula actualizada correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar aula' });
  }
});

app.delete('/aulas/:id', requireJefeTaller, async (req, res) => {
  try {
    const { id } = req.params;
    
    await execute('DELETE FROM Aula WHERE idAula = ?', [id]);
    
    res.json({ message: 'Aula eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar aula' });
  }
});

// DEPARTAMENTOS
app.get('/departamentos', async (_req, res) => {
  try {
    const departamentos = await query(`
      SELECT d.*, e.nombre as edificio_nombre, a.nombre as aula_nombre 
      FROM Departamento d 
      LEFT JOIN Edificio e ON d.idEdificio = e.idEdificio 
      LEFT JOIN Aula a ON d.idAula = a.idAula 
      ORDER BY d.nombre
    `);
    res.json(departamentos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener departamentos' });
  }
});

app.post('/departamentos', requireJefeTaller, async (req, res) => {
  try {
    const { nombre, idEdificio, idAula } = req.body;
    
    const result = await execute(
      'INSERT INTO Departamento (nombre, idEdificio, idAula) VALUES (?, ?, ?)',
      [nombre, idEdificio, idAula]
    );
    
    res.status(201).json({ 
      message: 'Departamento creado correctamente', 
      id: result.insertId 
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear departamento' });
  }
});

app.put('/departamentos/:id', requireJefeTaller, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, idEdificio, idAula } = req.body;
    
    await execute(
      'UPDATE Departamento SET nombre = ?, idEdificio = ?, idAula = ? WHERE idDepartamento = ?',
      [nombre, idEdificio, idAula, id]
    );
    
    res.json({ message: 'Departamento actualizado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar departamento' });
  }
});

app.delete('/departamentos/:id', requireJefeTaller, async (req, res) => {
  try {
    const { id } = req.params;
    
    await execute('DELETE FROM Departamento WHERE idDepartamento = ?', [id]);
    
    res.json({ message: 'Departamento eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar departamento' });
  }
});

// Obtener Equipos
app.get('/equipos', async (_req, res) => {
  try {
    const equipos = await query(`
      SELECT e.*, 
             d.nombre as departamento_nombre,
             a.nombre as aula_nombre,
             ed.nombre as edificio_nombre,
             t.nombre as tipo_equipo_nombre,
             u.nombre as responsable_nombre
      FROM Equipo e
      LEFT JOIN Departamento d ON e.idDepartamento = d.idDepartamento
      LEFT JOIN Aula a ON e.idAula = a.idAula
      LEFT JOIN Edificio ed ON a.idEdificio = ed.idEdificio
      LEFT JOIN TipoEquipo t ON e.idTipoEquipo = t.idTipoEquipo
      LEFT JOIN Usuario u ON e.idResponsable = u.idUsuario
      ORDER BY e.nombre
    `);
    res.json(equipos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener equipos' });
  }
});

// Crear nuevo equipo
app.post('/equipos', requireJefeTaller, async (req, res) => {
  try {
    const {
      codigo, nombre, marca, modelo, noSerie, idTipoEquipo,
      sistemaOperativo, procesador, ram_gb, almacenamiento_gb,
      direccion_ip, direccion_mac, fechaCompra, expiracionGarantia,
      idDepartamento, idAula, idResponsable, estado
    } = req.body;

    const result = await execute(`
      INSERT INTO Equipo 
      (codigo, nombre, marca, modelo, noSerie, idTipoEquipo, sistemaOperativo,
       procesador, ram_gb, almacenamiento_gb, direccion_ip, direccion_mac,
       fechaCompra, expiracionGarantia, idDepartamento, idAula, idResponsable, estado)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      codigo, nombre, marca, modelo, noSerie, idTipoEquipo, sistemaOperativo,
      procesador, ram_gb, almacenamiento_gb, direccion_ip, direccion_mac,
      fechaCompra, expiracionGarantia, idDepartamento, idAula, idResponsable, estado
    ]);

    res.status(201).json({ 
      message: 'Equipo creado correctamente', 
      id: result.insertId 
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear equipo' });
  }
});

// Actualizar equipo
app.put('/equipos/:id', requireJefeTaller, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      codigo, nombre, marca, modelo, noSerie, idTipoEquipo,
      sistemaOperativo, procesador, ram_gb, almacenamiento_gb,
      direccion_ip, direccion_mac, fechaCompra, expiracionGarantia,
      idDepartamento, idAula, idResponsable, estado, fechaUltimoMantenimiento
    } = req.body;

    await execute(`
      UPDATE Equipo 
      SET codigo = ?, nombre = ?, marca = ?, modelo = ?, noSerie = ?, idTipoEquipo = ?,
          sistemaOperativo = ?, procesador = ?, ram_gb = ?, almacenamiento_gb = ?,
          direccion_ip = ?, direccion_mac = ?, fechaCompra = ?, expiracionGarantia = ?,
          idDepartamento = ?, idAula = ?, idResponsable = ?, estado = ?, fechaUltimoMantenimiento = ?
      WHERE idEquipo = ?
    `, [
      codigo, nombre, marca, modelo, noSerie, idTipoEquipo, sistemaOperativo,
      procesador, ram_gb, almacenamiento_gb, direccion_ip, direccion_mac,
      fechaCompra, expiracionGarantia, idDepartamento, idAula, idResponsable, 
      estado, fechaUltimoMantenimiento, id
    ]);

    res.json({ message: 'Equipo actualizado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar equipo' });
  }
});

// Eliminar equipo
app.delete('/equipos/:id', requireJefeTaller, async (req, res) => {
  try {
    const { id } = req.params;
    await execute('DELETE FROM Equipo WHERE idEquipo = ?', [id]);
    res.json({ message: 'Equipo eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar equipo' });
  }
});

// Obtener todos los softwares
app.get('/software', async (_req, res) => {
    try {
        const software = await query('SELECT * FROM Software ORDER BY nombre');
        res.json(software);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener software' });
    }
});

// Crear nuevo software
app.post('/software', async (req, res) => {
    try {
        const { nombre, version, fabricante, tipoLicencia, fechaExpiracionLicencia, requiereActivacion, comentarios } = req.body;
        
        const result = await execute(`
            INSERT INTO Software 
            (nombre, version, fabricante, tipoLicencia, fechaExpiracionLicencia, requiereActivacion, comentarios)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [nombre, version, fabricante, tipoLicencia, fechaExpiracionLicencia, requiereActivacion, comentarios]);
        
        res.status(201).json({ 
            message: 'Software creado correctamente', 
            id: result.insertId 
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al crear software' });
    }
});

// Actualizar software
app.put('/software/:id', requireJefeTaller, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, version, fabricante, tipoLicencia, fechaExpiracionLicencia, requiereActivacion, comentarios } = req.body;

    await execute(`
      UPDATE Software 
      SET nombre = ?, version = ?, fabricante = ?, tipoLicencia = ?, 
          fechaExpiracionLicencia = ?, requiereActivacion = ?, comentarios = ?
      WHERE idSoftware = ?
    `, [nombre, version, fabricante, tipoLicencia, fechaExpiracionLicencia, requiereActivacion, comentarios, id]);

    res.json({ message: 'Software actualizado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar software' });
  }
});

// Eliminar software
app.delete('/software/:id', requireJefeTaller, async (req, res) => {
  try {
    const { id } = req.params;
    await execute('DELETE FROM Software WHERE idSoftware = ?', [id]);
    res.json({ message: 'Software eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar software' });
  }
});

// Obtener software instalado en un equipo
app.get('/equipos/:id/software', async (req, res) => {
    try {
        const { id } = req.params;
        const software = await query(`
            SELECT es.*, s.nombre, s.version, s.fabricante
            FROM EquipoSoftware es
            JOIN Software s ON es.idSoftware = s.idSoftware
            WHERE es.idEquipo = ?
            ORDER BY s.nombre
        `, [id]);
        
        res.json(software);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener software del equipo' });
    }
});

// Instalar software en equipo
app.post('/equipos/:id/software', async (req, res) => {
    try {
        const { id } = req.params;
        const { idSoftware, fechaInstalacion, licenciaKey, usuarioInstalacion, comentarios } = req.body;
        
        const result = await execute(`
            INSERT INTO EquipoSoftware 
            (idEquipo, idSoftware, fechaInstalacion, licenciaKey, usuarioInstalacion, comentarios)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [id, idSoftware, fechaInstalacion, licenciaKey, usuarioInstalacion, comentarios]);
        
        res.status(201).json({ 
            message: 'Software instalado correctamente', 
            id: result.insertId 
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al instalar software' });
    }
});

// Obtener contratos de un equipo
app.get('/equipos/:id/contratos', async (req, res) => {
    try {
        const { id } = req.params;
        const contratos = await query(`
            SELECT * FROM ContratoMantenimiento 
            WHERE idEquipo = ?
            ORDER BY fechaInicio DESC
        `, [id]);
        
        res.json(contratos);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener contratos' });
    }
});

// Crear contrato de mantenimiento
app.post('/contratos', async (req, res) => {
    try {
        const { idEquipo, proveedor, numeroContrato, contactoProveedor, telefonoContacto, 
                emailContacto, fechaInicio, fechaFin, costo, cobertura, estado } = req.body;
        
        const result = await execute(`
            INSERT INTO ContratoMantenimiento 
            (idEquipo, proveedor, numeroContrato, contactoProveedor, telefonoContacto, 
             emailContacto, fechaInicio, fechaFin, costo, cobertura, estado)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [idEquipo, proveedor, numeroContrato, contactoProveedor, telefonoContacto, 
            emailContacto, fechaInicio, fechaFin, costo, cobertura, estado]);
        
        res.status(201).json({ 
            message: 'Contrato creado correctamente', 
            id: result.insertId 
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al crear contrato' });
    }
});

// Obtener todos los contratos con información del equipo
app.get('/contratos', async (_req, res) => {
  try {
    const contratos = await query(`
      SELECT c.*, e.nombre as equipo_nombre, e.codigo as equipo_codigo
      FROM ContratoMantenimiento c
      LEFT JOIN Equipo e ON c.idEquipo = e.idEquipo
      ORDER BY c.fechaInicio DESC
    `);
    res.json(contratos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener contratos' });
  }
});

// Actualizar contrato
app.put('/contratos/:id', requireJefeTaller, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      idEquipo, proveedor, numeroContrato, contactoProveedor, telefonoContacto,
      emailContacto, fechaInicio, fechaFin, costo, cobertura, estado
    } = req.body;

    await execute(`
      UPDATE ContratoMantenimiento 
      SET idEquipo = ?, proveedor = ?, numeroContrato = ?, contactoProveedor = ?,
          telefonoContacto = ?, emailContacto = ?, fechaInicio = ?, fechaFin = ?,
          costo = ?, cobertura = ?, estado = ?
      WHERE idContrato = ?
    `, [
      idEquipo, proveedor, numeroContrato, contactoProveedor, telefonoContacto,
      emailContacto, fechaInicio, fechaFin, costo, cobertura, estado, id
    ]);

    res.json({ message: 'Contrato actualizado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar contrato' });
  }
});

// Eliminar contrato
app.delete('/contratos/:id', requireJefeTaller, async (req, res) => {
  try {
    const { id } = req.params;
    await execute('DELETE FROM ContratoMantenimiento WHERE idContrato = ?', [id]);
    res.json({ message: 'Contrato eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar contrato' });
  }
});

// Obtener relaciones de un CI
app.get('/ci/:tipo/:id/relaciones', async (req, res) => {
    try {
        const { tipo, id } = req.params;
        
        const relaciones = await query(`
            SELECT r.*, tr.nombre as tipo_relacion_nombre, tr.inversa
            FROM RelacionCI r
            JOIN TipoRelacion tr ON r.idTipoRelacion = tr.idTipoRelacion
            WHERE (r.idCIOrigen = ? AND r.tipoCIOrigen = ?)
               OR (r.idCIDestino = ? AND r.tipoCIDestino = ?)
            ORDER BY r.fechaCreacion DESC
        `, [id, tipo, id, tipo]);
        
        res.json(relaciones);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener relaciones' });
    }
});

// Crear relación entre CIs
app.post('/relaciones', async (req, res) => {
    try {
        const { idCIOrigen, tipoCIOrigen, idCIDestino, tipoCIDestino, idTipoRelacion, usuarioCreacion, comentarios } = req.body;
        
        const result = await execute(`
            INSERT INTO RelacionCI 
            (idCIOrigen, tipoCIOrigen, idCIDestino, tipoCIDestino, idTipoRelacion, usuarioCreacion, comentarios)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [idCIOrigen, tipoCIOrigen, idCIDestino, tipoCIDestino, idTipoRelacion, usuarioCreacion, comentarios]);
        
        res.status(201).json({ 
            message: 'Relación creada correctamente', 
            id: result.insertId 
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al crear relación' });
    }
});

// Obtener todos los tipos de relación
app.get('/tipos-relacion', async (_req, res) => {
    try {
        const tipos = await query('SELECT * FROM TipoRelacion ORDER BY nombre');
        res.json(tipos);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener tipos de relación' });
    }
});

// Obtener árbol de configuración de un equipo
app.get('/equipos/:id/configuracion-completa', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Información del equipo
        const equipo = await query(`
            SELECT e.*, d.nombre as departamento_nombre, a.nombre as aula_nombre,
                   u.nombre as responsable_nombre
            FROM Equipo e
            LEFT JOIN Departamento d ON e.idDepartamento = d.idDepartamento
            LEFT JOIN Aula a ON e.idAula = a.idAula
            LEFT JOIN Usuario u ON e.idResponsable = u.idUsuario
            WHERE e.idEquipo = ?
        `, [id]);
        
        if (equipo.length === 0) {
            res.status(404).json({ error: 'Equipo no encontrado' });
            return;
        }

        const software = await query(`
            SELECT es.*, s.nombre, s.version, s.fabricante
            FROM EquipoSoftware es
            JOIN Software s ON es.idSoftware = s.idSoftware
            WHERE es.idEquipo = ?
        `, [id]);

        const contratos = await query(`
            SELECT * FROM ContratoMantenimiento 
            WHERE idEquipo = ?
        `, [id]);

        const relaciones = await query(`
            SELECT r.*, tr.nombre as tipo_relacion_nombre, tr.inversa,
                   CASE 
                       WHEN r.tipoCIDestino = 'equipo' THEN (SELECT nombre FROM Equipo WHERE idEquipo = r.idCIDestino)
                       WHEN r.tipoCIDestino = 'aula' THEN (SELECT nombre FROM Aula WHERE idAula = r.idCIDestino)
                       WHEN r.tipoCIDestino = 'usuario' THEN (SELECT nombre FROM Usuario WHERE idUsuario = r.idCIDestino)
                       ELSE 'Otro'
                   END as destino_nombre
            FROM RelacionCI r
            JOIN TipoRelacion tr ON r.idTipoRelacion = tr.idTipoRelacion
            WHERE r.idCIOrigen = ? AND r.tipoCIOrigen = 'equipo'
        `, [id]);

        res.json({
            equipo: equipo[0],
            software,
            contratos,
            relaciones
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener configuración completa' });
    }
});

// Obtener reporte de auditoría
app.get('/auditoria-configuracion', async (_req, res) => {
    try {
        const auditoria = await query(`
            SELECT 
                e.codigo,
                e.nombre as equipo,
                e.estado,
                e.fechaUltimoMantenimiento,
                COUNT(es.idSoftware) as software_instalado,
                COUNT(c.idContrato) as contratos_activos
            FROM Equipo e
            LEFT JOIN EquipoSoftware es ON e.idEquipo = es.idEquipo
            LEFT JOIN ContratoMantenimiento c ON e.idEquipo = c.idEquipo AND c.estado = 'Vigente'
            GROUP BY e.idEquipo
            ORDER BY e.nombre
        `);
        
        res.json(auditoria);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener auditoría' });
    }
});

app.put('/equipos/:id/estado', async (req, res) => {
    try {
        const { id } = req.params;
        const { estado, fechaUltimoMantenimiento, fechaBaja } = req.body;
        
        await execute(`
            UPDATE Equipo 
            SET estado = ?, fechaUltimoMantenimiento = ?, fechaBaja = ?, fecha_modificacion = NOW()
            WHERE idEquipo = ?
        `, [estado, fechaUltimoMantenimiento, fechaBaja, id]);
        
        res.json({ message: 'Estado del equipo actualizado correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar estado del equipo' });
    }
});

// Obtener todos los usuarios
app.get('/usuarios', async (_req, res) => {
  try {
    const usuarios = await query(`
      SELECT u.*, t.nombre as tipo_usuario_nombre, d.nombre as departamento_nombre
      FROM Usuario u
      LEFT JOIN TipoUsuario t ON u.idTipoUsuario = t.idTipoUsuario
      LEFT JOIN Departamento d ON u.idDepartamento = d.idDepartamento
      ORDER BY u.nombre, u.apellidoPat
    `);
    
    const usuariosSinPassword = usuarios.map((usuario: any) => {
      const { password, ...usuarioSinPassword } = usuario;
      return usuarioSinPassword;
    });
    
    res.json(usuariosSinPassword);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

app.post('/usuarios', requireJefeTaller, async (req, res) => {
    try {
        const { 
            nombre, 
            apellidoPat, 
            apellidoMat, 
            email, 
            password, 
            idTipoUsuario, 
            idDepartamento 
        } = req.body;
        
        const usuariosExistentes = await query(
            'SELECT idUsuario FROM Usuario WHERE email = ?',
            [email]
        );
        
        if (usuariosExistentes.length > 0) {
            res.status(400).json({ error: 'El email ya está registrado' });
            return;
        }
        
        const bcrypt = require('bcrypt');
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        const result = await execute(`
            INSERT INTO Usuario 
            (nombre, apellidoPat, apellidoMat, email, password, idTipoUsuario, idDepartamento)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [nombre, apellidoPat, apellidoMat, email, hashedPassword, idTipoUsuario, idDepartamento]);
        
        res.status(201).json({ 
            message: 'Usuario creado correctamente', 
            id: result.insertId 
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al crear usuario' });
    }
});

// Actualizar usuario
app.put('/usuarios/:id', requireJefeTaller, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      nombre, 
      apellidoPat, 
      apellidoMat, 
      email, 
      idTipoUsuario, 
      idDepartamento,
      activo 
    } = req.body;
    
    const usuariosExistentes = await query(
      'SELECT idUsuario FROM Usuario WHERE email = ? AND idUsuario != ?',
      [email, id]
    );
    
    if (usuariosExistentes.length > 0) {
      res.status(400).json({ error: 'El email ya está registrado' });
      return;
    }
    
    await execute(`
      UPDATE Usuario 
      SET nombre = ?, apellidoPat = ?, apellidoMat = ?, email = ?, 
          idTipoUsuario = ?, idDepartamento = ?, activo = ?
      WHERE idUsuario = ?
    `, [nombre, apellidoPat, apellidoMat, email, idTipoUsuario, idDepartamento, activo, id]);
    
    res.json({ message: 'Usuario actualizado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

// Cambiar password de usuario
app.put('/usuarios/:id/password', requireJefeTaller, async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    
    const bcrypt = require('bcrypt');
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    await execute(
      'UPDATE Usuario SET password = ? WHERE idUsuario = ?',
      [hashedPassword, id]
    );
    
    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar contraseña' });
  }
});

// Desactivar/activar usuario
app.put('/usuarios/:id/estado', requireJefeTaller, async (req, res) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;
    
    await execute(
      'UPDATE Usuario SET activo = ? WHERE idUsuario = ?',
      [activo, id]
    );
    
    res.json({ message: `Usuario ${activo ? 'activado' : 'desactivado'} correctamente` });
  } catch (error) {
    res.status(500).json({ error: 'Error al cambiar estado del usuario' });
  }
});

app.delete('/usuarios/:id/fisica', requireJefeTaller, async (req, res) => {
  try {
    const { id } = req.params;
    
    const usuarioActualId = req.headers['usuario-id'];
    if (usuarioActualId && parseInt(usuarioActualId as string) === parseInt(id)) {
      res.status(400).json({ error: 'No puedes eliminarte a ti mismo' });
      return;
    }

    const usuarios = await query('SELECT * FROM Usuario WHERE idUsuario = ?', [id]);
    if (usuarios.length === 0) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    await execute('DELETE FROM Usuario WHERE idUsuario = ?', [id]);
    
    res.json({ message: 'Usuario eliminado permanentemente de la base de datos' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ error: 'Error al eliminar usuario permanentemente' });
  }
});

// Rutas de autenticacion
app.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        console.log('Intento de login:', email);
        
        const usuarios = await query(`
            SELECT u.*, t.nombre as tipo_usuario_nombre 
            FROM Usuario u 
            JOIN TipoUsuario t ON u.idTipoUsuario = t.idTipoUsuario 
            WHERE u.email = ? AND u.activo = 1
        `, [email]);
        
        if (usuarios.length === 0) {
            console.log('Usuario no encontrado:', email);
            res.status(401).json({ error: 'Credenciales inválidas' });
            return;
        }
        
        const usuario = usuarios[0];
        console.log('Usuario encontrado:', usuario.email);
        
        const bcrypt = require('bcrypt');
        
        const passwordValido = await bcrypt.compare(password, usuario.password);
        
        if (!passwordValido) {
            console.log('Password incorrecto para:', email);
            res.status(401).json({ error: 'Credenciales inválidas' });
            return;
        }
        
        const { password: _, ...usuarioSinPassword } = usuario;
        
        res.json({
            message: 'Login exitoso',
            usuario: usuarioSinPassword,
            token: 'token_simulado_' + Date.now()
        });
        
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error en el login' });
    }
});

app.get('/auth/perfil', async (req, res) => {
    try {
        const { usuarioId } = req.query;
        
        const usuarios = await query(`
            SELECT u.*, t.nombre as tipo_usuario_nombre 
            FROM Usuario u 
            JOIN TipoUsuario t ON u.idTipoUsuario = t.idTipoUsuario 
            WHERE u.idUsuario = ? AND u.activo = 1
        `, [usuarioId]);
        
        if (usuarios.length === 0) {
            res.status(404).json({ error: 'Usuario no encontrado' });
            return;
        }
        
        const { password: _, ...usuario } = usuarios[0];
        res.json(usuario);
        
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener perfil' });
    }
});

// Ruta de prueba
app.get('/hola', (_req, res) => {
    res.send('Hola Mundo desde el sistema de incidencias');
});

// Iniciar servidor
app.listen(PUERTO, () => {
    console.log(`Servidor escuchando en el puerto ${PUERTO}`);
    console.log(`Endpoints de Gestión de Configuración disponibles:`);
    console.log(`- GET /software - Obtener todo el software`);
    console.log(`- POST /software - Crear nuevo software`);
    console.log(`- GET /equipos/:id/software - Software instalado en equipo`);
    console.log(`- POST /equipos/:id/software - Instalar software`);
    console.log(`- GET /equipos/:id/contratos - Contratos del equipo`);
    console.log(`- POST /contratos - Crear contrato`);
    console.log(`- GET /ci/:tipo/:id/relaciones - Relaciones del CI`);
    console.log(`- POST /relaciones - Crear relación`);
    console.log(`- GET /tipos-relacion - Tipos de relación`);
    console.log(`- GET /equipos/:id/configuracion-completa - Árbol de configuración`);
    console.log(`- GET /auditoria-configuracion - Reporte de auditoría`);
    console.log(`- PUT /equipos/:id/estado - Actualizar estado de equipo`);
});