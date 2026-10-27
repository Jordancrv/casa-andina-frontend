import type { WeatherScene as Scene } from '../travel-weather'

/** Paisaje decorativo: las partículas de precipitación requieren un código del proveedor. */
export function WeatherScene({ scene, season, sunny }: { scene: Scene; season: string; sunny: boolean }) {
  return <div className={`ca-weather-scene ca-weather-scene--${scene}`} data-season={season.toLowerCase()} aria-hidden="true">
    <div className="ca-scene-glow"/>
    {(scene === 'sunny' || scene === 'breezy' || (scene === 'frost' && sunny)) && <div className="ca-scene-sun"><div className="ca-scene-rays"/><div className="ca-scene-sun-core"/></div>}
    <div className="ca-scene-landscape"><svg viewBox="0 0 800 260" preserveAspectRatio="none"><path className="ca-mountain-back" d="M0 260V194l108-53 83 18L323 22l151 134 69-67 127 89 130-64v146Z"/><path className="ca-mountain-front" d="M0 260V221l145-57 100 49 103-62 181 75 97-63 174 62v35Z"/>{scene === 'frost' && <path className="ca-mountain-ice" d="m323 22-57 59 36-14 21 18 18-17 43 22Z"/>}</svg></div>
    {scene !== 'neutral' && <><div className="ca-scene-cloud ca-scene-cloud--one"/><div className="ca-scene-cloud ca-scene-cloud--two"/><div className="ca-scene-cloud ca-scene-cloud--three"/></>}
    {scene === 'mist' && <><div className="ca-scene-mist"/><div className="ca-scene-mist ca-scene-mist--second"/></>}
    {(scene === 'rain' || scene === 'storm') && <div className="ca-scene-rain">{Array.from({length:18}, (_, i) => <i key={i} style={{left:`${5+i*5.6}%`,animationDelay:`${i%7*-.27}s`,animationDuration:`${.85+i%4*.17}s`}}/>)}</div>}
    {scene === 'snow' && <div className="ca-scene-snow">{Array.from({length:15}, (_, i) => <i key={i} style={{left:`${3+i*6.4}%`,animationDelay:`${i%6*-1.1}s`,animationDuration:`${5+i%5}s`}}>✦</i>)}</div>}
    {scene === 'storm' && <svg className="ca-scene-lightning" viewBox="0 0 60 100"><path d="M33 0 4 55h24L18 100l38-61H32L45 0Z"/></svg>}
    {(scene === 'sunny' || scene === 'breezy') && season === 'Otoño' && <div className="ca-scene-leaves"><i>❧</i><i>❧</i><i>❧</i></div>}
  </div>
}
