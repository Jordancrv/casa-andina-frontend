import { Link } from 'react-router-dom'
import logo from '@/assets/casa-andina.png'
import destinos from '@/assets/destinos-casa-andina.webp'
import './landing.css'

const sedesDestacadas = [
  { ciudad: 'Lima', nombre: 'Premium Miraflores', zona: 'Costa', descripcion: 'A pasos del corazón de Miraflores y con la costa del Pacífico como escenario.', imagePosition: 'left center' },
  { ciudad: 'Cusco', nombre: 'Premium Cusco', zona: 'Sierra', descripcion: 'Historia, cultura y hospitalidad cerca de la Plaza de Armas de la ciudad imperial.', imagePosition: 'center center' },
  { ciudad: 'Arequipa', nombre: 'Premium Arequipa', zona: 'Sierra', descripcion: 'Arquitectura de sillar y una ubicación privilegiada en el centro histórico.', imagePosition: 'right center' }
]

const ciudades = ['Trujillo', 'Lima', 'Ica', 'Arequipa', 'Cusco', 'Piura', 'Junín', 'Áncash', 'Lambayeque']

export const LandingPage = () => {
  return (
    <main className="landing-page">
      <header className="landing-header">
        <Link className="landing-logo" to="/" aria-label="Casa Andina, inicio"><img src={logo} alt="Casa Andina Hoteles" /></Link>
        <nav aria-label="Navegación principal">
          <a href="#sedes">Sedes</a><a href="#experiencia">Experiencia</a>
          <Link className="header-login" to="/login">Entrar al sistema</Link>
        </nav>
      </header>

      <section className="landing-hero" style={{ backgroundImage: `url(${destinos})` }}>
        <div className="hero-overlay" />
        <div className="hero-content">
          <p className="landing-eyebrow">Hoteles en los destinos que inspiran</p>
          <h1>Casa Andina</h1>
          <p className="hero-lead">Descubre el Perú con la comodidad de sentirte en casa, desde la costa hasta los Andes.</p>
          <div className="hero-actions">
            <a className="landing-primary" href="#sedes">Explorar hoteles</a>
            <Link className="landing-secondary" to="/login">Entrar al sistema</Link>
          </div>
        </div>
        <div className="hero-location-strip" aria-label="Destinos destacados"><span>Miraflores</span><span>Cusco</span><span>Arequipa</span></div>
      </section>

      <section className="landing-intro" id="experiencia">
        <p className="landing-eyebrow">Hospitalidad peruana</p>
        <div>
          <h2>Un hotel para cada forma de viajar</h2>
          <p>Encuentra ubicaciones estratégicas, atención cercana y servicios pensados para viajes de descanso o de trabajo. Casa Andina conecta experiencias auténticas en las principales ciudades del país.</p>
        </div>
        <dl>
          <div><dt>10</dt><dd>Hoteles registrados</dd></div>
          <div><dt>9</dt><dd>Ciudades del Perú</dd></div>
          <div><dt>3</dt><dd>Categorías de estadía</dd></div>
        </dl>
      </section>

      <section className="landing-sedes" id="sedes">
        <header className="section-heading">
          <div><p className="landing-eyebrow">Sedes destacadas</p><h2>Elige tu próximo destino</h2></div>
          <p>Premium, Select y Standard para acompañar cada tipo de viaje.</p>
        </header>
        <div className="sede-grid">
          {sedesDestacadas.map((sede) => (
            <article className="sede-card" key={sede.ciudad}>
              <div className="sede-image" role="img" aria-label={`Vista de ${sede.ciudad}`} style={{ backgroundImage: `url(${destinos})`, backgroundPosition: sede.imagePosition }} />
              <div className="sede-copy">
                <div><span>{sede.zona}</span><span>{sede.ciudad}</span></div>
                <h3>Casa Andina {sede.nombre}</h3>
                <p>{sede.descripcion}</p>
                <Link to="/login">Consultar disponibilidad <span aria-hidden="true">→</span></Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="coverage-band">
        <div><p className="landing-eyebrow">Presencia nacional</p><h2>Más destinos, la misma bienvenida</h2></div>
        <ul aria-label="Ciudades con presencia de Casa Andina">{ciudades.map((ciudad) => <li key={ciudad}>{ciudad}</li>)}</ul>
      </section>

      <section className="landing-access">
        <p className="landing-eyebrow">Tu viaje comienza aquí</p><h2>Reserva y gestiona tu estadía</h2>
        <p>Accede al portal para consultar habitaciones, servicios y tus próximas reservas.</p>
        <Link className="landing-primary" to="/login">Entrar al sistema</Link>
      </section>

      <footer className="landing-footer"><img src={logo} alt="Casa Andina Hoteles" /><p>Hospitalidad peruana en cada destino.</p><Link to="/login">Portal de clientes</Link></footer>

      <button className="ai-assistant-button" type="button" aria-label="Asistente Casa Andina, próximamente" title="Asistente Casa Andina, próximamente">
        <span aria-hidden="true">🤖</span><span className="ai-assistant-label"><strong>Asistente</strong>Próximamente</span>
      </button>
    </main>
  )
}
