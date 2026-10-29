import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import logo from '@/assets/casa-andina.png'
import { SEDE_IMAGES } from '@/shared/constants/sede-images'
import { AsistentePublico } from './AsistentePublico'
import './landing.css'

const sedesDestacadas = [
  { codigo: 'MIR-PRE', ciudad: 'Lima', nombre: 'Casa Andina Premium Miraflores', zona: 'Costa', descripcion: 'A pasos del corazón de Miraflores y con la costa del Pacífico como escenario.' },
  { codigo: 'CUS-PRE', ciudad: 'Cusco', nombre: 'Casa Andina Premium Cusco', zona: 'Sierra', descripcion: 'Historia, cultura y hospitalidad cerca de la Plaza de Armas de la ciudad imperial.' },
  { codigo: 'ARQ-PRE', ciudad: 'Arequipa', nombre: 'Casa Andina Premium Arequipa', zona: 'Sierra', descripcion: 'Arquitectura de sillar y una ubicación privilegiada en el centro histórico.' },
  { codigo: 'CHI-SEL', ciudad: 'Chiclayo', nombre: 'Casa Andina Select Chiclayo', zona: 'Costa', descripcion: 'Descubre Chiclayo y disfruta de la hospitalidad del norte.' },
  { codigo: 'HYO-ASO', ciudad: 'Huancayo', nombre: 'Hotel de Turistas Huancayo', zona: 'Sierra', descripcion: 'Una sede asociada para conocer Huancayo y el valle del Mantaro.' },
  { codigo: 'HRZ-ASO', ciudad: 'Huaraz', nombre: 'Andino Club Hotel Huaraz', zona: 'Sierra', descripcion: 'Una sede asociada para tu estadía en Huaraz.' },
  { codigo: 'SIS-PRE', ciudad: 'Lima', nombre: 'Casa Andina Premium San Isidro', zona: 'Costa', descripcion: 'Disfruta de una estadía en el distrito limeño de San Isidro.' },
  { codigo: 'NAZ-STD', ciudad: 'Nasca', nombre: 'Casa Andina Standard Nasca', zona: 'Costa', descripcion: 'Tu punto de partida para descubrir la historia de Nasca.' },
  { codigo: 'PIU-PRE', ciudad: 'Piura', nombre: 'Casa Andina Premium Piura', zona: 'Costa', descripcion: 'Comodidad y hospitalidad para tu próxima visita a Piura.' },
  { codigo: 'TRU-STD', ciudad: 'Trujillo', nombre: 'Casa Andina Standard Trujillo Plaza', zona: 'Costa', descripcion: 'Conoce Trujillo y disfruta de sus tradiciones y cultura.' },
]

const ciudades = ['Trujillo', 'Lima', 'Nasca', 'Arequipa', 'Cusco', 'Piura', 'Huancayo', 'Huaraz', 'Chiclayo']

export const LandingPage = () => {
  const pageRef = useRef<HTMLElement>(null)
  const carouselRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const page = pageRef.current
    if (!page || !('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const elements = page.querySelectorAll<HTMLElement>('.intro-photo, .intro-copy, .landing-intro dl, .sede-carousel-heading, .sede-carousel-controls, .sede-carousel, .coverage-copy, .coverage-explore, .access-content, .access-note, .landing-footer')
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed')
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0, rootMargin: '0px 0px -40px 0px' })

    elements.forEach(element => {
      if (element.getBoundingClientRect().top >= window.innerHeight) {
        element.classList.add('scroll-reveal')
        observer.observe(element)
      }
    })
    return () => {
      observer.disconnect()
      elements.forEach(element => element.classList.remove('scroll-reveal', 'is-revealed'))
    }
  }, [])
  const moveCarousel = (direction: number) => {
    const carousel = carouselRef.current
    if (!carousel) return
    const card = carousel.querySelector<HTMLElement>('.sede-card')
    const distance = (card?.getBoundingClientRect().width ?? carousel.clientWidth) + 18
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    carousel.scrollBy({ left: direction * distance, behavior: reducedMotion ? 'instant' : 'smooth' })
  }
  return (
    <main className="landing-page" ref={pageRef}>
      <header className="landing-header">
        <Link className="landing-logo" to="/" aria-label="Casa Andina, inicio"><img src={logo} alt="Casa Andina Hoteles" /></Link>
        <nav aria-label="Navegación principal">
          <a href="#sedes">Sedes</a><a href="#experiencia">Experiencia</a>
          <Link className="header-login" to="/login">Ingresar</Link>
        </nav>
      </header>

      <section className="landing-hero" style={{ backgroundImage: 'url(https://res.cloudinary.com/pwxlpuek/image/upload/v1792341509/overlay-fondo.jpg)' }}>
        <div className="hero-overlay" />
        <div className="hero-content">
          <p className="landing-eyebrow">Hoteles en los destinos que inspiran</p>
          <h1>Casa Andina<span>El Perú se siente en casa</span></h1>
          <p className="hero-lead">Descubre el Perú con la comodidad de sentirte en casa, desde la costa hasta los Andes.</p>
          <div className="hero-actions">
            <a className="landing-primary" href="#sedes">Explorar hoteles <span aria-hidden="true">↗</span></a>
            <Link className="landing-secondary" to="/login">Ingresar</Link>
          </div>
        </div>
        <div className="hero-location-strip" aria-label="Destinos destacados"><span>Miraflores</span><span>Cusco</span><span>Arequipa</span></div>
        <a className="hero-discover" href="#experiencia"><span aria-hidden="true">↓</span> Descubre nuestra esencia</a>
      </section>

      <section className="landing-intro" id="experiencia">
        <figure className="intro-photo">
          <img src={SEDE_IMAGES['ARQ-PRE']} alt="Fachada de Casa Andina Premium Arequipa" loading="lazy" decoding="async" />
          <figcaption><span>01 / Hospitalidad con historia</span>Casa Andina Premium Arequipa</figcaption>
        </figure>
        <div className="intro-copy">
          <p className="landing-eyebrow">Hospitalidad peruana</p>
          <h2>Un hotel para cada <em>forma de viajar</em></h2>
          <p>Encuentra ubicaciones estratégicas, atención cercana y servicios pensados para viajes de descanso o de trabajo. Casa Andina conecta experiencias auténticas en las principales ciudades del país.</p>
          <a className="intro-link" href="#sedes">Encuentra tu destino <span aria-hidden="true">↗</span></a>
        </div>
        <dl>
          <div><dt>10</dt><dd>Hoteles registrados</dd></div>
          <div><dt>9</dt><dd>Ciudades del Perú</dd></div>
          <div><dt>4</dt><dd>Categorías de estadía</dd></div>
        </dl>
      </section>

      <section className="landing-sedes" id="sedes">
        <header className="section-heading sede-carousel-heading">
          <div><p className="landing-eyebrow">Nuestras sedes</p><h2>Elige tu próximo destino</h2></div>
          <p>Premium, Select, Standard y hoteles asociados para acompañar cada tipo de viaje.</p>
        </header>
        <div className="sede-carousel-controls" aria-label="Controles de las sedes">
          <p>Explora nuestros 10 hoteles</p>
          <button type="button" onClick={() => moveCarousel(-1)} aria-label="Ver sedes anteriores" aria-controls="sedes-carousel">←</button>
          <button type="button" onClick={() => moveCarousel(1)} aria-label="Ver sedes siguientes" aria-controls="sedes-carousel">→</button>
        </div>
        <div className="sede-grid sede-carousel" id="sedes-carousel" ref={carouselRef} role="region" aria-label="Carrusel de hoteles" tabIndex={0}>
          {sedesDestacadas.map((sede, index) => (
            <article className="sede-card" key={sede.codigo}>
              <div className="sede-photo">
              <img className="sede-image" src={SEDE_IMAGES[sede.codigo]} alt={`Vista del hotel en ${sede.ciudad}`} loading="lazy" decoding="async" />
                <span className="sede-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                <span className="sede-photo-city">{sede.ciudad}</span>
              </div>
              <div className="sede-copy">
                <div><span>{sede.zona}</span><span>{sede.ciudad}</span></div>
                <h3>{sede.nombre}</h3>
                <p>{sede.descripcion}</p>
                <Link to="/login">Consultar disponibilidad <span aria-hidden="true">→</span></Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="coverage-band">
        <div className="coverage-copy"><p className="landing-eyebrow">Presencia nacional</p><h2>Más destinos,<br /><em>la misma bienvenida</em></h2><p className="coverage-description">De la costa a los Andes, encuentra una casa para tu próxima historia.</p><div className="coverage-count"><strong>{ciudades.length.toString().padStart(2, '0')}</strong><span>ciudades para<br />descubrir el Perú</span></div><a className="coverage-link" href="#sedes">Explorar nuestras sedes <span aria-hidden="true">↗</span></a></div>
        <div className="coverage-explore"><div className="coverage-gallery" aria-label="Destinos destacados">{['CUS-PRE', 'ARQ-PRE', 'MIR-PRE'].map((codigo) => { const sede = sedesDestacadas.find(item => item.codigo === codigo)!; return <a className="coverage-photo" key={codigo} href="#sedes" aria-label={`Explorar sedes, incluido ${sede.ciudad}`}><img src={SEDE_IMAGES[codigo]} alt="" loading="lazy" decoding="async" /><span>{sede.ciudad}</span></a> })}</div><p className="coverage-cities-label">Encuéntranos también en</p><ul aria-label="Ciudades con presencia de Casa Andina">{ciudades.map((ciudad) => <li key={ciudad}>{ciudad}</li>)}</ul></div>
      </section>

      <section className="landing-access" style={{ backgroundImage: `linear-gradient(90deg, rgba(10,42,34,.94), rgba(10,42,34,.65)), url(${SEDE_IMAGES['PIU-PRE']})` }}>
        <div className="access-content"><p className="landing-eyebrow">Tu viaje comienza aquí</p><h2>Tu próximo recuerdo<br /><em>te está esperando</em></h2>
        <p>Accede al portal para consultar habitaciones, servicios y tus próximas reservas.</p>
        <Link className="landing-primary" to="/login">Ingresar al portal <span aria-hidden="true">↗</span></Link></div>
        <div className="access-note"><span aria-hidden="true">✳</span><p>Un nuevo destino,<br /><em>una bienvenida familiar.</em></p><small>CASA ANDINA · PERÚ</small></div>
      </section>

      <footer className="landing-footer"><img src={logo} alt="Casa Andina Hoteles" /><p>Hospitalidad peruana en cada destino.</p><Link to="/login">Portal de clientes</Link></footer>

      <AsistentePublico />
    </main>
  )
}
