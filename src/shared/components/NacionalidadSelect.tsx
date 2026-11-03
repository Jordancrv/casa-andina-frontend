import { useId } from 'react'

// Códigos ISO 3166-1 para mantener el catálogo compartido entre formularios.
const codigos = `AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW`.split(' ')
const regiones = new Intl.DisplayNames(['es'], { type: 'region' })
const paises = codigos.map(codigo => regiones.of(codigo) ?? codigo).sort((a, b) => a.localeCompare(b, 'es'))

interface Props { value?: string; onChange?: (value: string) => void; name?: string; required?: boolean }

export function NacionalidadSelect({ value, onChange, name, required }: Props) {
  const id = useId()
  return <select id={id} name={name} required={required} value={value} defaultValue={value === undefined ? '' : undefined} onChange={onChange ? event => onChange(event.target.value) : undefined}>
    <option value="">Seleccionar país</option>
    {value && !paises.includes(value) && <option value={value}>{value}</option>}
    {paises.map(pais => <option key={pais} value={pais}>{pais}</option>)}
  </select>
}
