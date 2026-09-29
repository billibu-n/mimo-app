/* Diccionario ESPAÑOL (idioma base). Formato i18next: clave -> texto.
   Si una clave falta en otro idioma, se muestra esta. */
registrarIdioma('es', {
  // --- cabecera de la pantalla de Ajustes (piloto del motor de idiomas) ---
  'ajustes.tituloApp': 'Ajustes de la aplicación',
  'ajustes.subApp': 'Lo que vale para toda la aplicación.',
  'ajustes.notaSecciones': { parts: [
    'Estos ajustes ', ['b', 'no son generales'],
    ': pertenecen a una sola sección y se abren desde su propia pantalla. Es el cambio principal frente a la mezcla actual.'
  ] },

  // --- las tarjetas de la aplicación ---
  'ajustes.apariencia': 'Apariencia',
  'ajustes.apariencia.d': 'Tema y color.',
  'ajustes.general': 'General',
  'ajustes.general.d': 'Lo que vale para toda la aplicación.',
  'ajustes.navegacion': 'Navegación',
  'ajustes.navegacion.d': 'Ubicación y navegación de las secciones.',
  'ajustes.idioma': 'Idioma',
  'ajustes.idioma.d': 'El idioma de la interfaz.',
  'ajustes.colaborar': 'Colaborar',
  'ajustes.colaborar.d': 'Apoyar el proyecto con un café.',
  'ajustes.semestre': 'Semestre',
  'ajustes.semestre.d': 'Los semestres guardados y sus metas.',
  'ajustes.respaldo': 'Respaldo',
  'ajustes.respaldo.d': 'Tus datos viven en este navegador: esto es lo que los pone a salvo. Descárgalos, cárgalos en otro equipo o vuelve al principio.',
  'ajustes.respaldoTilde': 'lo más importante',

  // --- el panel de Idioma ---
  'idioma.sub': 'El idioma de los textos de la interfaz.',
  'idioma.titulo': 'Idioma de la interfaz',
  'idioma.nota': 'Ocho idiomas. Solo los que están listos traducen de verdad; el resto se queda en español.',
  'idioma.preparacion': 'en preparación',
  'idioma.simplificado': 'chino simplificado',
  'idioma.tradicional': 'chino tradicional'
});
