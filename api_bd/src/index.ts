import express from 'express';
import cors from 'cors';
import { query, execute } from './database';

const app = express();
const PUERTO = 3001;

const requireTecnicoOJefeTaller = (req: any, res: any, next: any) => {
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
      
      if (usuarios.length === 0) {
        res.status(403).json({ error: 'Usuario no encontrado o inactivo' });
        return;
      }
      
      const usuario = usuarios[0];
      
      // Permitir tanto Jefe de Taller como Técnico
      if (usuario.tipo_usuario !== 'Jefe de Taller' && usuario.tipo_usuario !== 'Técnico') {
        res.status(403).json({ error: 'No tienes permisos para realizar esta acción' });
        return;
      }
      
      req.usuario = usuario;
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

app.post('/edificios', requireTecnicoOJefeTaller, async (req, res) => {
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

app.put('/edificios/:id', requireTecnicoOJefeTaller, async (req, res) => {
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

app.delete('/edificios/:id', requireTecnicoOJefeTaller, async (req, res) => {
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

app.post('/aulas', requireTecnicoOJefeTaller, async (req, res) => {
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

app.put('/aulas/:id', requireTecnicoOJefeTaller, async (req, res) => {
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

app.delete('/aulas/:id', requireTecnicoOJefeTaller, async (req, res) => {
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

app.post('/departamentos', requireTecnicoOJefeTaller, async (req, res) => {
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

app.put('/departamentos/:id', requireTecnicoOJefeTaller, async (req, res) => {
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

app.delete('/departamentos/:id', requireTecnicoOJefeTaller, async (req, res) => {
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
app.post('/equipos', requireTecnicoOJefeTaller, async (req, res) => {
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
app.put('/equipos/:id', requireTecnicoOJefeTaller, async (req, res) => {
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
app.delete('/equipos/:id', requireTecnicoOJefeTaller, async (req, res) => {
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
app.put('/software/:id', requireTecnicoOJefeTaller, async (req, res) => {
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
app.delete('/software/:id', requireTecnicoOJefeTaller, async (req, res) => {
  try {
    const { id } = req.params;
    await execute('DELETE FROM Software WHERE idSoftware = ?', [id]);
    res.json({ message: 'Software eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar software' });
  }
});

//Obtener equipos que tienen instalado un software
app.get('/software/:id/equipos', async (req, res) => {
    try {
        const { id } = req.params;
        const equipos = await query(`
            SELECT 
                e.idEquipo,
                e.codigo,
                e.nombre,
                e.marca,
                e.modelo,
                e.idTipoEquipo,
                t.nombre as tipo_equipo_nombre,
                CONCAT(ed.nombre, ' / ', a.nombre) as ubicacion,
                u.nombre as responsable_nombre,
                e.estado,
                es.fechaInstalacion,
                es.licenciaKey,
                es.usuarioInstalacion,
                es.comentarios
            FROM EquipoSoftware es
            JOIN Equipo e ON es.idEquipo = e.idEquipo
            LEFT JOIN TipoEquipo t ON e.idTipoEquipo = t.idTipoEquipo
            LEFT JOIN Aula a ON e.idAula = a.idAula
            LEFT JOIN Edificio ed ON a.idEdificio = ed.idEdificio
            LEFT JOIN Usuario u ON e.idResponsable = u.idUsuario
            WHERE es.idSoftware = ?
            ORDER BY e.nombre, es.fechaInstalacion DESC
        `, [id]);
        
        res.json(equipos);
    } catch (error) {
        console.error('Error al obtener equipos con software:', error);
        res.status(500).json({ error: 'Error al obtener equipos con el software instalado' });
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
app.put('/contratos/:id', requireTecnicoOJefeTaller, async (req, res) => {
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
app.delete('/contratos/:id', requireTecnicoOJefeTaller, async (req, res) => {
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

app.post('/usuarios', requireTecnicoOJefeTaller, async (req, res) => {
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
app.put('/usuarios/:id', requireTecnicoOJefeTaller, async (req, res) => {
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
app.put('/usuarios/:id/password', requireTecnicoOJefeTaller, async (req, res) => {
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
app.put('/usuarios/:id/estado', requireTecnicoOJefeTaller, async (req, res) => {
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

app.delete('/usuarios/:id/fisica', requireTecnicoOJefeTaller, async (req, res) => {
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
//cambiar contraseña
app.put('/auth/cambiar-password', async (req, res) => {
  try {
    const usuarioId = req.headers['usuario-id'];
    const { passwordActual, nuevaPassword } = req.body;
    
    if (!usuarioId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }
    
    // Verificar contraseña actual
    const usuarios = await query(
      'SELECT password FROM Usuario WHERE idUsuario = ? AND activo = 1',
      [usuarioId]
    );
    
    if (usuarios.length === 0) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }
    
    const usuario = usuarios[0];
    const bcrypt = require('bcrypt');
    
    const passwordValido = await bcrypt.compare(passwordActual, usuario.password);
    
    if (!passwordValido) {
      res.status(400).json({ error: 'La contraseña actual es incorrecta' });
      return;
    }
    
    // Hashear nueva contraseña
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(nuevaPassword, saltRounds);
    
    // Actualizar contraseña
    await execute(
      'UPDATE Usuario SET password = ? WHERE idUsuario = ?',
      [hashedPassword, usuarioId]
    );
    
    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({ error: 'Error al cambiar la contraseña' });
  }
});

// Obtener todas las incidencias
app.get('/incidencias', async (_req, res) => {
  try {
    const incidencias = await query(`
      SELECT i.*, 
             e.nombre as estado_nombre,
             t.nombre as tipo_incidencia_nombre,
             CONCAT(u.nombre, ' ', u.apellidoPat) as usuario_reporta_nombre,
             CONCAT(ut.nombre, ' ', ut.apellidoPat) as tecnico_asignado_nombre,
             eq.nombre as equipo_nombre,
             d.nombre as departamento_nombre
      FROM Incidencia i
      LEFT JOIN EstadoIncidencia e ON i.idEstadoIncidencia = e.idEstadoIncidencia
      LEFT JOIN TipoIncidencia t ON i.idTipoIncidencia = t.idTipoIncidencia
      LEFT JOIN Usuario u ON i.idUsuarioReporta = u.idUsuario
      LEFT JOIN Usuario ut ON i.idTecnicoAsignado = ut.idUsuario
      LEFT JOIN Equipo eq ON i.idEquipo = eq.idEquipo
      LEFT JOIN Departamento d ON i.idDepartamento = d.idDepartamento
      ORDER BY i.idIncidencia ASC  -- CAMBIADO: de DESC a ASC
    `);
    res.json(incidencias);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener incidencias' });
  }
});

// Crear nueva incidencia
app.post('/incidencias', async (req, res) => {
  try {
    const {
      titulo, descripcion, idTipoIncidencia, idEquipo, idDepartamento, prioridad
    } = req.body;
    
    const usuarioId = req.headers['usuario-id'];
    
    const result = await execute(`
      INSERT INTO Incidencia 
      (titulo, descripcion, idEstadoIncidencia, idTipoIncidencia, idUsuarioReporta, idEquipo, idDepartamento, prioridad)
      VALUES (?, ?, 1, ?, ?, ?, ?, ?)
    `, [titulo, descripcion, idTipoIncidencia, usuarioId, idEquipo, idDepartamento, prioridad]);
    
    res.status(201).json({ 
      message: 'Incidencia creada correctamente', 
      id: result.insertId 
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear incidencia' });
  }
});

// Obtener incidencias por usuario
app.get('/usuarios/:id/incidencias', async (req, res) => {
  try {
    const { id } = req.params;
    const incidencias = await query(`
      SELECT i.*, e.nombre as estado_nombre, t.nombre as tipo_incidencia_nombre
      FROM Incidencia i
      LEFT JOIN EstadoIncidencia e ON i.idEstadoIncidencia = e.idEstadoIncidencia
      LEFT JOIN TipoIncidencia t ON i.idTipoIncidencia = t.idTipoIncidencia
      WHERE i.idUsuarioReporta = ?
      ORDER BY i.fecha_creacion DESC
    `, [id]);
    res.json(incidencias);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener incidencias del usuario' });
  }
});

// Actualizar incidencia
app.put('/incidencias/:id', requireTecnicoOJefeTaller, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      titulo, descripcion, idEstadoIncidencia, idTipoIncidencia,
      idTecnicoAsignado, prioridad, comentarios_cierre
    } = req.body;

    // Construir la consulta dinámicamente basada en los campos proporcionados
    let updateFields = [];
    let params = [];

    if (titulo !== undefined) {
      updateFields.push('titulo = ?');
      params.push(titulo);
    }
    if (descripcion !== undefined) {
      updateFields.push('descripcion = ?');
      params.push(descripcion);
    }
    if (idEstadoIncidencia !== undefined) {
      updateFields.push('idEstadoIncidencia = ?');
      params.push(idEstadoIncidencia);
    }
    if (idTipoIncidencia !== undefined) {
      updateFields.push('idTipoIncidencia = ?');
      params.push(idTipoIncidencia);
    }
    if (idTecnicoAsignado !== undefined) {
      updateFields.push('idTecnicoAsignado = ?');
      params.push(idTecnicoAsignado);
    }
    if (prioridad !== undefined) {
      updateFields.push('prioridad = ?');
      params.push(prioridad);
    }
    if (comentarios_cierre !== undefined) {
      updateFields.push('comentarios_cierre = ?');
      params.push(comentarios_cierre);
    }

    // Siempre actualizar la fecha de modificación
    updateFields.push('fecha_actualizacion = CURRENT_TIMESTAMP');

    if (updateFields.length === 0) {
      res.status(400).json({ error: 'No se proporcionaron campos para actualizar' });
      return;
    }

    params.push(id);

    const query = `UPDATE Incidencia SET ${updateFields.join(', ')} WHERE idIncidencia = ?`;
    
    await execute(query, params);

    res.json({ message: 'Incidencia actualizada correctamente' });
  } catch (error) {
    console.error('Error al actualizar incidencia:', error);
    res.status(500).json({ error: 'Error al actualizar incidencia' });
  }
});

// Agregar entrada al historial de incidencia
app.post('/incidencias/:id/historial', requireTecnicoOJefeTaller, async (req, res) => {
  try {
    const { id } = req.params;
    const { idEstadoNuevo, comentario } = req.body;
    const usuarioId = req.headers['usuario-id'];

    // Obtener estado actual de la incidencia
    const incidencias = await query(
      'SELECT idEstadoIncidencia FROM Incidencia WHERE idIncidencia = ?',
      [id]
    );

    if (incidencias.length === 0) {
      res.status(404).json({ error: 'Incidencia no encontrada' });
      return;
    }

    const idEstadoAnterior = incidencias[0].idEstadoIncidencia;

    const result = await execute(`
      INSERT INTO HistorialIncidencia 
      (idIncidencia, idEstadoAnterior, idEstadoNuevo, idUsuarioCambio, comentario)
      VALUES (?, ?, ?, ?, ?)
    `, [id, idEstadoAnterior, idEstadoNuevo, usuarioId, comentario]);

    res.status(201).json({ 
      message: 'Historial agregado correctamente', 
      id: result.insertId 
    });
  } catch (error) {
    console.error('Error al agregar historial:', error);
    res.status(500).json({ error: 'Error al agregar historial' });
  }
});

// Obtener historial de incidencia
app.get('/incidencias/:id/historial', async (req, res) => {
  try {
    const { id } = req.params;
    const historial = await query(`
      SELECT h.*, 
             ea.nombre as estado_anterior_nombre,
             en.nombre as estado_nuevo_nombre,
             CONCAT(u.nombre, ' ', u.apellidoPat) as usuario_cambio_nombre,
             t.nombre as tipo_usuario_cambio
      FROM HistorialIncidencia h
      LEFT JOIN EstadoIncidencia ea ON h.idEstadoAnterior = ea.idEstadoIncidencia
      LEFT JOIN EstadoIncidencia en ON h.idEstadoNuevo = en.idEstadoIncidencia
      LEFT JOIN Usuario u ON h.idUsuarioCambio = u.idUsuario
      LEFT JOIN TipoUsuario t ON u.idTipoUsuario = t.idTipoUsuario
      WHERE h.idIncidencia = ?
      ORDER BY h.fecha_cambio ASC
    `, [id]);
    res.json(historial);
  } catch (error) {
    console.error('Error al obtener historial:', error);
    res.status(500).json({ error: 'Error al obtener historial' });
  }
});

// Obtener técnicos (usuarios con tipo Técnico)
app.get('/tecnicos', async (_req, res) => {
  try {
    const tecnicos = await query(`
      SELECT u.*, t.nombre as tipo_usuario_nombre, d.nombre as departamento_nombre
      FROM Usuario u
      LEFT JOIN TipoUsuario t ON u.idTipoUsuario = t.idTipoUsuario
      LEFT JOIN Departamento d ON u.idDepartamento = d.idDepartamento
      WHERE t.nombre = 'Técnico' AND u.activo = 1
      ORDER BY u.nombre, u.apellidoPat
    `);
    
    const tecnicosSinPassword = tecnicos.map((tecnico: any) => {
      const { password, ...tecnicoSinPassword } = tecnico;
      return tecnicoSinPassword;
    });
    
    res.json(tecnicosSinPassword);
  } catch (error) {
    console.error('Error al obtener técnicos:', error);
    res.status(500).json({ error: 'Error al obtener técnicos' });
  }
});
// Obtener incidencias asignadas a un técnico
app.get('/tecnicos/:id/incidencias', async (req, res) => {
  try {
    const { id } = req.params;
    const incidencias = await query(`
      SELECT i.*, 
             e.nombre as estado_nombre,
             t.nombre as tipo_incidencia_nombre,
             CONCAT(u.nombre, ' ', u.apellidoPat) as usuario_reporta_nombre,
             CONCAT(ut.nombre, ' ', ut.apellidoPat) as tecnico_asignado_nombre,
             eq.nombre as equipo_nombre,
             d.nombre as departamento_nombre
      FROM Incidencia i
      LEFT JOIN EstadoIncidencia e ON i.idEstadoIncidencia = e.idEstadoIncidencia
      LEFT JOIN TipoIncidencia t ON i.idTipoIncidencia = t.idTipoIncidencia
      LEFT JOIN Usuario u ON i.idUsuarioReporta = u.idUsuario
      LEFT JOIN Usuario ut ON i.idTecnicoAsignado = ut.idUsuario
      LEFT JOIN Equipo eq ON i.idEquipo = eq.idEquipo
      LEFT JOIN Departamento d ON i.idDepartamento = d.idDepartamento
      WHERE i.idTecnicoAsignado = ?
      ORDER BY i.fecha_creacion DESC
    `, [id]);
    res.json(incidencias);
  } catch (error) {
    console.error('Error al obtener incidencias del técnico:', error);
    res.status(500).json({ error: 'Error al obtener incidencias del técnico' });
  }
});

// Obtener especialidades
app.get('/especialidades', async (_req, res) => {
  try {
    const especialidades = await query('SELECT * FROM EspecialidadTecnico ORDER BY nombre');
    res.json(especialidades);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener especialidades' });
  }
});

// Obtener técnicos con sus especialidades y carga de trabajo
app.get('/tecnicos/detallados', async (_req, res) => {
  try {
    const tecnicos = await query(`
      SELECT 
        u.idUsuario,
        u.nombre,
        u.apellidoPat,
        u.apellidoMat,
        u.email,
        d.nombre as departamento_nombre,
        GROUP_CONCAT(DISTINCT e.nombre SEPARATOR ', ') as especialidades,
        COUNT(DISTINCT te.idEspecialidad) as cantidad_especialidades,
        (SELECT COUNT(*) FROM Incidencia i WHERE i.idTecnicoAsignado = u.idUsuario AND i.fecha_cierre IS NULL) as incidencias_activas
      FROM Usuario u
      LEFT JOIN Departamento d ON u.idDepartamento = d.idDepartamento
      LEFT JOIN TecnicoEspecialidad te ON u.idUsuario = te.idUsuario
      LEFT JOIN EspecialidadTecnico e ON te.idEspecialidad = e.idEspecialidad
      WHERE u.idTipoUsuario = (SELECT idTipoUsuario FROM TipoUsuario WHERE nombre = 'Técnico') 
        AND u.activo = 1
      GROUP BY u.idUsuario
      ORDER BY u.nombre
    `);
    res.json(tecnicos);
  } catch (error) {
    console.error('Error al obtener técnicos detallados:', error);
    res.status(500).json({ error: 'Error al obtener técnicos' });
  }
});

// Obtener técnicos recomendados para una incidencia
app.get('/incidencias/:id/tecnicos-recomendados', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Obtener información de la incidencia
    const incidencias = await query(`
      SELECT i.*, t.idEspecialidadRecomendada 
      FROM Incidencia i 
      LEFT JOIN TipoIncidencia t ON i.idTipoIncidencia = t.idTipoIncidencia 
      WHERE i.idIncidencia = ?
    `, [id]);
    
    if (incidencias.length === 0) {
      res.status(404).json({ error: 'Incidencia no encontrada' });
      return;
    }
    
    const incidencia = incidencias[0];
    const especialidadRecomendada = incidencia.idEspecialidadRecomendada;
    
    // Obtener técnicos ordenados por compatibilidad
    let queryTecnicos = `
      SELECT 
        u.idUsuario,
        u.nombre,
        u.apellidoPat,
        u.apellidoMat,
        u.email,
        d.nombre as departamento_nombre,
        te.nivel_expertise,
        e.nombre as especialidad_nombre,
        (SELECT COUNT(*) FROM Incidencia i2 WHERE i2.idTecnicoAsignado = u.idUsuario AND i2.fecha_cierre IS NULL) as incidencias_activas,
        -- Puntaje de compatibilidad
        CASE 
          WHEN te.idEspecialidad = ? THEN 
            CASE te.nivel_expertise
              WHEN 'avanzado' THEN 100
              WHEN 'intermedio' THEN 80
              WHEN 'basico' THEN 60
              ELSE 0
            END
          ELSE 40
        END as puntaje_compatibilidad
      FROM Usuario u
      LEFT JOIN Departamento d ON u.idDepartamento = d.idDepartamento
      LEFT JOIN TecnicoEspecialidad te ON u.idUsuario = te.idUsuario
      LEFT JOIN EspecialidadTecnico e ON te.idEspecialidad = e.idEspecialidad
      WHERE u.idTipoUsuario = (SELECT idTipoUsuario FROM TipoUsuario WHERE nombre = 'Técnico') 
        AND u.activo = 1
    `;
    
    const params = [especialidadRecomendada];
    
    if (especialidadRecomendada) {
      queryTecnicos += ` AND te.idEspecialidad IS NOT NULL`;
    }
    
    queryTecnicos += ` ORDER BY puntaje_compatibilidad DESC, incidencias_activas ASC, u.nombre`;
    
    const tecnicos = await query(queryTecnicos, params);
    
    res.json({
      incidencia: {
        id: incidencia.idIncidencia,
        titulo: incidencia.titulo,
        tipo: incidencia.tipo_incidencia_nombre,
        especialidad_recomendada: especialidadRecomendada
      },
      tecnicos_recomendados: tecnicos
    });
  } catch (error) {
    console.error('Error al obtener técnicos recomendados:', error);
    res.status(500).json({ error: 'Error al obtener técnicos recomendados' });
  }
});

// Endpoints para especialidades de usuarios
app.get('/usuarios/:id/especialidades', async (req, res) => {
  try {
    const { id } = req.params;
    const especialidades = await query(`
      SELECT te.*, e.nombre, e.descripcion
      FROM TecnicoEspecialidad te
      JOIN EspecialidadTecnico e ON te.idEspecialidad = e.idEspecialidad
      WHERE te.idUsuario = ?
    `, [id]);
    res.json(especialidades);
  } catch (error) {
    console.error('Error al obtener especialidades del usuario:', error);
    res.status(500).json({ error: 'Error al obtener especialidades' });
  }
});

app.post('/usuarios/:id/especialidades', requireTecnicoOJefeTaller, async (req, res) => {
  try {
    const { id } = req.params;
    const { especialidades } = req.body;

    // Eliminar especialidades existentes
    await execute('DELETE FROM TecnicoEspecialidad WHERE idUsuario = ?', [id]);

    // Insertar nuevas especialidades
    for (const esp of especialidades) {
      await execute(
        'INSERT INTO TecnicoEspecialidad (idUsuario, idEspecialidad, nivel_expertise) VALUES (?, ?, ?)',
        [id, esp.idEspecialidad, esp.nivel_expertise]
      );
    }

    res.json({ message: 'Especialidades actualizadas correctamente' });
  } catch (error) {
    console.error('Error al actualizar especialidades:', error);
    res.status(500).json({ error: 'Error al actualizar especialidades' });
  }
});

app.put('/usuarios/:id/especialidades', requireTecnicoOJefeTaller, async (req, res) => {
  try {
    const { id } = req.params;
    const { especialidades } = req.body;

    // Eliminar especialidades existentes
    await execute('DELETE FROM TecnicoEspecialidad WHERE idUsuario = ?', [id]);

    // Insertar nuevas especialidades
    for (const esp of especialidades) {
      await execute(
        'INSERT INTO TecnicoEspecialidad (idUsuario, idEspecialidad, nivel_expertise) VALUES (?, ?, ?)',
        [id, esp.idEspecialidad, esp.nivel_expertise]
      );
    }

    res.json({ message: 'Especialidades actualizadas correctamente' });
  } catch (error) {
    console.error('Error al actualizar especialidades:', error);
    res.status(500).json({ error: 'Error al actualizar especialidades' });
  }
});
// Obtener todos los items del almacén
app.get('/almacen', async (_req, res) => {
  try {
    const items = await query(`
      SELECT * FROM Almacen 
      ORDER BY codigo
    `);
    res.json(items);
  } catch (error) {
    console.error('Error al obtener items del almacén:', error);
    res.status(500).json({ error: 'Error al obtener items del almacén' });
  }
});

// Crear nuevo item en almacén
app.post('/almacen', async (req, res) => {
  try {
    const { 
      codigo, nombre, descripcion, categoria, stock_actual, stock_minimo,
      ubicacion, proveedor, fecha_adquisicion, costo_unitario, estado 
    } = req.body;
    
    console.log('Datos recibidos para crear item:', req.body);

    const result = await execute(
      `INSERT INTO Almacen 
       (codigo, nombre, descripcion, categoria, stock_actual, stock_minimo,
        ubicacion, proveedor, fecha_adquisicion, costo_unitario, estado) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        codigo, nombre, descripcion || null, categoria, 
        Number(stock_actual), Number(stock_minimo),
        ubicacion || null, proveedor || null, 
        fecha_adquisicion || null, costo_unitario || null,
        estado || 'disponible'
      ]
    );

    console.log('Éxito - Item creado con ID:', result.insertId);
    
    res.status(201).json({ 
      message: 'Item creado exitosamente', 
      id: result.insertId 
    });
  } catch (error: any) {
    console.error('Error en POST /almacen:', error.message);
    res.status(500).json({ 
      error: 'Error del servidor: ' + error.message
    });
  }
});

// Actualizar item de almacén
app.put('/almacen/:id', requireTecnicoOJefeTaller, async (req, res) => {
  try {
    const { id } = req.params;
    const itemData = req.body;

    console.log('📥 Actualizando item de almacén:', id, itemData);

    // Convertir undefined a null para MySQL
    const datosParaActualizar = {
      codigo: itemData.codigo,
      nombre: itemData.nombre,
      descripcion: itemData.descripcion || null,
      categoria: itemData.categoria,
      stock_actual: Number(itemData.stock_actual) || 0,
      stock_minimo: Number(itemData.stock_minimo) || 0,
      ubicacion: itemData.ubicacion || null,
      proveedor: itemData.proveedor || null,
      fecha_adquisicion: itemData.fecha_adquisicion || null,
      costo_unitario: itemData.costo_unitario || null,
      estado: itemData.estado || 'disponible'
    };

    await execute(`
      UPDATE Almacen 
      SET codigo = ?, nombre = ?, descripcion = ?, categoria = ?, 
          stock_actual = ?, stock_minimo = ?, ubicacion = ?, proveedor = ?,
          fecha_adquisicion = ?, costo_unitario = ?, estado = ?
      WHERE idAlmacen = ?
    `, [
      datosParaActualizar.codigo,
      datosParaActualizar.nombre,
      datosParaActualizar.descripcion,
      datosParaActualizar.categoria,
      datosParaActualizar.stock_actual,
      datosParaActualizar.stock_minimo,
      datosParaActualizar.ubicacion,
      datosParaActualizar.proveedor,
      datosParaActualizar.fecha_adquisicion,
      datosParaActualizar.costo_unitario,
      datosParaActualizar.estado,
      id
    ]);

    console.log('✅ Item de almacén actualizado correctamente:', id);
    return res.json({ message: 'Item de almacén actualizado correctamente' });
    
  } catch (error: any) {
    console.error('❌ Error al actualizar item de almacén:', error.message);
    return res.status(500).json({ error: 'Error al actualizar item de almacén: ' + error.message });
  }
});

// Eliminar item de almacén
app.delete('/almacen/:id', requireTecnicoOJefeTaller, async (req, res) => {
  try {
    const { id } = req.params;
    await execute('DELETE FROM Almacen WHERE idAlmacen = ?', [id]);
    res.json({ message: 'Item de almacén eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar item de almacén:', error);
    res.status(500).json({ error: 'Error al eliminar item de almacén' });
  }
});

// Obtener un item específico
app.get('/almacen/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const items = await query('SELECT * FROM Almacen WHERE idAlmacen = ?', [id]);
    
    if (items.length === 0) {
      res.status(404).json({ error: 'Item no encontrado' });
      return;
    }
    
    res.json(items[0]);
  } catch (error) {
    console.error('Error al obtener item de almacén:', error);
    res.status(500).json({ error: 'Error al obtener item de almacén' });
  }
});

// Registrar movimiento
app.post('/almacen/movimientos', async (req, res) => {
  try {
    const {
      idAlmacen,
      tipo_movimiento,
      cantidad,
      motivo,
      idUsuario,
      idIncidencia,
      idRFC,  
      comentarios
    } = req.body;

    // Primero obtener el item actual
    const items = await query('SELECT * FROM Almacen WHERE idAlmacen = ?', [idAlmacen]);
    if (items.length === 0) {
      res.status(404).json({ error: 'Item de almacén no encontrado' });
      return;
    }

    const item = items[0];
    let nuevoStock = item.stock_actual;

    // Calcular nuevo stock según el tipo de movimiento
    if (tipo_movimiento === 'entrada') {
      nuevoStock += cantidad;
    } else if (tipo_movimiento === 'salida') {
      if (item.stock_actual < cantidad) {
        res.status(400).json({ error: 'Stock insuficiente para realizar la salida' });
        return;
      }
      nuevoStock -= cantidad;
    }

 // Registrar el movimiento con RFC
    const result = await execute(`
      INSERT INTO MovimientoAlmacen 
      (idAlmacen, tipo_movimiento, cantidad, motivo, idUsuario, 
       idIncidencia, idRFC, comentarios)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [idAlmacen, tipo_movimiento, cantidad, motivo, idUsuario, 
        idIncidencia || null, idRFC || null, comentarios || null]);

    // Actualizar el stock del item
    await execute(
      'UPDATE Almacen SET stock_actual = ? WHERE idAlmacen = ?',
      [nuevoStock, idAlmacen]
    );

    res.status(201).json({ 
      message: 'Movimiento registrado correctamente', 
      id: result.insertId,
      nuevoStock: nuevoStock
    });
  } catch (error) {
    console.error('Error al registrar movimiento:', error);
    res.status(500).json({ error: 'Error al registrar movimiento' });
  }
});

// Obtener movimientos (todos o por item)
app.get('/almacen/movimientos', async (req, res) => {
  try {
    const { idAlmacen } = req.query;
    
    let queryStr = `
      SELECT m.*, 
             CONCAT(u.nombre, ' ', u.apellidoPat) as usuario_nombre,
             a.nombre as item_nombre,
             a.codigo as item_codigo
      FROM MovimientoAlmacen m
      LEFT JOIN Usuario u ON m.idUsuario = u.idUsuario
      LEFT JOIN Almacen a ON m.idAlmacen = a.idAlmacen
    `;
    
    const params = [];
    
    if (idAlmacen) {
      queryStr += ' WHERE m.idAlmacen = ?';
      params.push(idAlmacen);
    }
    
    queryStr += ' ORDER BY m.fecha_movimiento DESC';
    
    const movimientos = await query(queryStr, params);
    res.json(movimientos);
  } catch (error) {
    console.error('Error al obtener movimientos:', error);
    res.status(500).json({ error: 'Error al obtener movimientos del almacén' });
  }
});

// Obtener movimientos de un item específico
app.get('/almacen/:idAlmacen/movimientos', async (req, res) => {
  try {
    const { idAlmacen } = req.params;
    
    const movimientos = await query(`
      SELECT m.*, 
             CONCAT(u.nombre, ' ', u.apellidoPat) as usuario_nombre
      FROM MovimientoAlmacen m
      LEFT JOIN Usuario u ON m.idUsuario = u.idUsuario
      WHERE m.idAlmacen = ?
      ORDER BY m.fecha_movimiento DESC
    `, [idAlmacen]);
    
    res.json(movimientos);
  } catch (error) {
    console.error('Error al obtener movimientos del item:', error);
    res.status(500).json({ error: 'Error al obtener movimientos del item' });
  }
});
// Obtener todos los RFC
app.get('/rfc', async (_req, res) => {
  try {
    const rfc = await query(`
      SELECT r.*, 
             CONCAT(u.nombre, ' ', u.apellidoPat) as solicitante_nombre,
             CONCAT(ua.nombre, ' ', ua.apellidoPat) as aprobador_nombre
      FROM RFC r
      LEFT JOIN Usuario u ON r.idUsuarioSolicitante = u.idUsuario
      LEFT JOIN Usuario ua ON r.idUsuarioAprobador = ua.idUsuario
      ORDER BY r.fecha_solicitud DESC
    `);
    res.json(rfc);
  } catch (error) {
    console.error('Error al obtener RFC:', error);
    res.status(500).json({ error: 'Error al obtener RFC' });
  }
});

// Crear nuevo RFC
app.post('/rfc', requireTecnicoOJefeTaller, async (req, res) => {
  try {
    const {
      titulo,
      descripcion,
      justificacion,
      impacto,
      idUsuarioSolicitante,
      idTipoCambio,
      prioridad,
      estado,
      tiempo_estimado_minutos
    } = req.body;

    console.log('Creando RFC con datos:', req.body);

    const result = await execute(`
      INSERT INTO RFC 
      (titulo, descripcion, justificacion, impacto, idUsuarioSolicitante, idTipoCambio, prioridad, estado, tiempo_estimado_minutos)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [titulo, descripcion, justificacion, impacto, idUsuarioSolicitante, idTipoCambio, prioridad, estado, tiempo_estimado_minutos || 60]);

    console.log('RFC creado con ID:', result.insertId);

    res.status(201).json({ 
      message: 'RFC creado correctamente', 
      id: result.insertId 
    });
  } catch (error: any) {
    console.error('Error al crear RFC:', error.message);
    res.status(500).json({ error: 'Error al crear RFC: ' + error.message });
  }
});

// Actualizar RFC
app.put('/rfc/:id', requireTecnicoOJefeTaller, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      titulo,
      descripcion,
      justificacion,
      impacto,
      idTipoCambio,
      prioridad,
      estado,
      tiempo_estimado_minutos
    } = req.body;

    await execute(`
      UPDATE RFC 
      SET titulo = ?, descripcion = ?, justificacion = ?, impacto = ?, 
          idTipoCambio = ?, prioridad = ?, estado = ?, tiempo_estimado_minutos = ? 
      WHERE idRFC = ?
    `, [titulo, descripcion, justificacion, impacto, idTipoCambio, prioridad, estado, tiempo_estimado_minutos || 60, id]);

    res.json({ message: 'RFC actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar RFC:', error);
    res.status(500).json({ error: 'Error al actualizar RFC' });
  }
});

// Actualizar estado del RFC
app.put('/rfc/:id/estado', requireTecnicoOJefeTaller, async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    await execute(
      'UPDATE RFC SET estado = ? WHERE idRFC = ?',
      [estado, id]
    );

    res.json({ message: 'Estado del RFC actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar estado del RFC:', error);
    res.status(500).json({ error: 'Error al actualizar estado del RFC' });
  }
});

// Aprobar RFC
app.put('/rfc/:id/aprobar', requireTecnicoOJefeTaller, async (req, res) => {
  try {
    const { id } = req.params;
    const { comentarios } = req.body;
    const usuarioId = req.headers['usuario-id'];

    await execute(`
      UPDATE RFC 
      SET estado = 'aprobado', 
          fecha_aprobacion = NOW(),
          idUsuarioAprobador = ?,
          comentarios_aprobacion = ?
      WHERE idRFC = ?
    `, [usuarioId, comentarios, id]);

    res.json({ message: 'RFC aprobado correctamente' });
  } catch (error) {
    console.error('Error al aprobar RFC:', error);
    res.status(500).json({ error: 'Error al aprobar RFC' });
  }
});

// Rechazar RFC
app.put('/rfc/:id/rechazar', requireTecnicoOJefeTaller, async (req, res) => {
  try {
    const { id } = req.params;
    const { comentarios } = req.body;
    const usuarioId = req.headers['usuario-id'];

    await execute(`
      UPDATE RFC 
      SET estado = 'rechazado', 
          fecha_aprobacion = NOW(),
          idUsuarioAprobador = ?,
          comentarios_aprobacion = ?
      WHERE idRFC = ?
    `, [usuarioId, comentarios, id]);

    res.json({ message: 'RFC rechazado correctamente' });
  } catch (error) {
    console.error('Error al rechazar RFC:', error);
    res.status(500).json({ error: 'Error al rechazar RFC' });
  }
});

// Obtener items de un RFC
app.get('/rfc/:id/items', async (req, res) => {
  try {
    const { id } = req.params;
    const items = await query(`
      SELECT * FROM RFCItem 
      WHERE idRFC = ?
      ORDER BY idRFCItem
    `, [id]);
    res.json(items);
  } catch (error) {
    console.error('Error al obtener items del RFC:', error);
    res.status(500).json({ error: 'Error al obtener items del RFC' });
  }
});

// Obtener bitácora de un RFC
app.get('/rfc/:id/bitacora', async (req, res) => {
  try {
    const { id } = req.params;
    const bitacora = await query(`
      SELECT b.*, 
             CONCAT(u.nombre, ' ', u.apellidoPat) as usuario_nombre
      FROM BitacoraCambio b
      LEFT JOIN Usuario u ON b.idUsuario = u.idUsuario
      WHERE b.idRFC = ?
      ORDER BY b.fecha_cambio DESC
    `, [id]);
    res.json(bitacora);
  } catch (error) {
    console.error('Error al obtener bitácora del RFC:', error);
    res.status(500).json({ error: 'Error al obtener bitácora del RFC' });
  }
});

// Crear items para RFC
app.post('/rfc/:id/items', requireTecnicoOJefeTaller, async (req, res) => {
  try {
    const { id } = req.params;
    const { items } = req.body;

    console.log('Guardando items para RFC:', id, items);

    // Eliminar items existentes primero
    await execute('DELETE FROM RFCItem WHERE idRFC = ?', [id]);

    // Insertar nuevos items
    for (const item of items) {
      // Convertir undefined a null explícitamente
      const estadoAnterior = item.estado_anterior !== undefined ? item.estado_anterior : null;
      const estadoNuevo = item.estado_nuevo !== undefined ? item.estado_nuevo : null;

      await execute(`
        INSERT INTO RFCItem 
        (idRFC, tipo_item, id_item, descripcion_cambio, estado_anterior, estado_nuevo)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        id, 
        item.tipo_item, 
        item.id_item, 
        item.descripcion_cambio, 
        estadoAnterior, 
        estadoNuevo
      ]);
    }

    console.log('Items del RFC guardados correctamente para RFC:', id);
    res.status(201).json({ message: 'Items del RFC guardados correctamente' });
  } catch (error: any) {
    console.error('Error al guardar items del RFC:', error.message);
    res.status(500).json({ error: 'Error al guardar items del RFC: ' + error.message });
  }
});

app.put('/rfc/:id/items', requireTecnicoOJefeTaller, async (req, res) => {
  try {
    const { id } = req.params;
    const { items } = req.body;

    console.log('Actualizando items para RFC:', id, items);

    // Eliminar items existentes primero
    await execute('DELETE FROM RFCItem WHERE idRFC = ?', [id]);

    // Insertar nuevos items
    for (const item of items) {
      // Convertir undefined a null explícitamente
      const estadoAnterior = item.estado_anterior !== undefined ? item.estado_anterior : null;
      const estadoNuevo = item.estado_nuevo !== undefined ? item.estado_nuevo : null;

      await execute(`
        INSERT INTO RFCItem 
        (idRFC, tipo_item, id_item, descripcion_cambio, estado_anterior, estado_nuevo)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        id, 
        item.tipo_item, 
        item.id_item, 
        item.descripcion_cambio, 
        estadoAnterior, 
        estadoNuevo
      ]);
    }

    console.log('Items del RFC actualizados correctamente para RFC:', id);
    res.json({ message: 'Items del RFC actualizados correctamente' });
  } catch (error: any) {
    console.error('Error al actualizar items del RFC:', error.message);
    res.status(500).json({ error: 'Error al actualizar items del RFC: ' + error.message });
  }
});

// Detectar problemas potenciales automáticamente
app.get('/problemas/deteccion-automatica', async (_req, res) => {
  try {
    // 1. Buscar incidencias recurrentes (mismo equipo, mismo tipo, último mes)
    const incidenciasRecurrentes = await query(`
      SELECT 
        i.idEquipo,
        e.nombre as equipo_nombre,
        t.nombre as tipo_incidencia,
        COUNT(*) as total_incidencias,
        GROUP_CONCAT(i.idIncidencia) as ids_incidencias
      FROM Incidencia i
      JOIN Equipo e ON i.idEquipo = e.idEquipo
      JOIN TipoIncidencia t ON i.idTipoIncidencia = t.idTipoIncidencia
      WHERE i.fecha_creacion >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        AND i.idEquipo IS NOT NULL
      GROUP BY i.idEquipo, i.idTipoIncidencia
      HAVING COUNT(*) >= 3
      ORDER BY total_incidencias DESC
    `);

    // 2. Buscar patrones por tipo de incidencia
    const patronesTipo = await query(`
      SELECT 
        i.idTipoIncidencia,
        t.nombre as tipo_incidencia,
        COUNT(*) as total_incidencias,
        GROUP_CONCAT(DISTINCT i.idEquipo) as equipos_afectados
      FROM Incidencia i
      JOIN TipoIncidencia t ON i.idTipoIncidencia = t.idTipoIncidencia
      WHERE i.fecha_creacion >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY i.idTipoIncidencia
      HAVING COUNT(*) >= 5
      ORDER BY total_incidencias DESC
    `);

    res.json({
      incidenciasRecurrentes,
      patronesTipo,
      message: 'Detección automática completada'
    });
  } catch (error) {
    console.error('Error en detección automática:', error);
    res.status(500).json({ error: 'Error en detección automática' });
  }
});

// Obtener estados de problema
app.get('/problemas/estados', async (_req, res) => {
  try {
    const estados = await query('SELECT * FROM EstadoProblema ORDER BY idEstadoProblema');
    res.json(estados);
  } catch (error) {
    console.error('Error al obtener estados de problema:', error);
    res.status(500).json({ error: 'Error al obtener estados de problema' });
  }
});

// Obtener categorías de problema
app.get('/problemas/categorias', async (_req, res) => {
  try {
    const categorias = await query('SELECT * FROM CategoriaProblema ORDER BY nombre');
    res.json(categorias);
  } catch (error) {
    console.error('Error al obtener categorías de problema:', error);
    res.status(500).json({ error: 'Error al obtener categorías de problema' });
  }
});

// Obtener todos los problemas
app.get('/problemas', async (_req, res) => {
  try {
    const problemas = await query(`
      SELECT p.*, 
             ep.nombre as estado_nombre,
             cp.nombre as categoria_nombre,
             CONCAT(ur.nombre, ' ', ur.apellidoPat) as usuario_reporta_nombre,
             CONCAT(ut.nombre, ' ', ut.apellidoPat) as tecnico_asignado_nombre,
             (SELECT COUNT(*) FROM ProblemaIncidencia pi WHERE pi.idProblema = p.idProblema) as total_incidencias
      FROM Problema p
      LEFT JOIN EstadoProblema ep ON p.idEstadoProblema = ep.idEstadoProblema
      LEFT JOIN CategoriaProblema cp ON p.idCategoriaProblema = cp.idCategoriaProblema
      LEFT JOIN Usuario ur ON p.idUsuarioReporta = ur.idUsuario
      LEFT JOIN Usuario ut ON p.idTecnicoAsignado = ut.idUsuario
      ORDER BY p.fecha_reporte DESC
    `);
    res.json(problemas);
  } catch (error) {
    console.error('Error al obtener problemas:', error);
    res.status(500).json({ error: 'Error al obtener problemas' });
  }
});

// Crear nuevo problema
app.post('/problemas', async (req, res) => {
  try {
    const {
      titulo, descripcion, causa_raiz, solucion_permanente, idEstadoProblema,
      idUsuarioReporta, idTecnicoAsignado, idCategoriaProblema, prioridad,
      impacto, fecha_vencimiento
    } = req.body;

    const result = await execute(`
      INSERT INTO Problema 
      (titulo, descripcion, causa_raiz, solucion_permanente, idEstadoProblema,
       idUsuarioReporta, idTecnicoAsignado, idCategoriaProblema, prioridad,
       impacto, fecha_vencimiento)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      titulo, descripcion, causa_raiz || null, solucion_permanente || null, idEstadoProblema,
      idUsuarioReporta, idTecnicoAsignado || null, idCategoriaProblema || null, prioridad,
      impacto || null, fecha_vencimiento || null
    ]);

    res.status(201).json({ 
      message: 'Problema creado correctamente', 
      id: result.insertId 
    });
  } catch (error) {
    console.error('Error al crear problema:', error);
    res.status(500).json({ error: 'Error al crear problema' });
  }
});

// Buscar incidencias para vincular
app.get('/incidencias', async (req, res) => {
  try {
    const { busqueda } = req.query;
    
    let queryStr = `
      SELECT i.*, 
             e.nombre as equipo_nombre,
             t.nombre as tipo_incidencia_nombre,
             es.nombre as estado_nombre
      FROM Incidencia i
      LEFT JOIN Equipo e ON i.idEquipo = e.idEquipo
      LEFT JOIN TipoIncidencia t ON i.idTipoIncidencia = t.idTipoIncidencia
      LEFT JOIN EstadoIncidencia es ON i.idEstadoIncidencia = es.idEstadoIncidencia
      WHERE 1=1
    `;
    
    const params = [];
    
    if (busqueda) {
      queryStr += ` AND (i.titulo LIKE ? OR i.descripcion LIKE ? OR e.nombre LIKE ?)`;
      const searchTerm = `%${busqueda}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    queryStr += ` ORDER BY i.fecha_creacion DESC LIMIT 20`;
    
    const incidencias = await query(queryStr, params);
    res.json(incidencias);
  } catch (error) {
    console.error('Error al buscar incidencias:', error);
    res.status(500).json({ error: 'Error al buscar incidencias' });
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