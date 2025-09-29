export default function Sponsor({ name, image, link }) {
  return (
    <a href={link} target="_blank" rel="noreferrer">
      <img src={`/images/sponsors/${image}`} alt={name} />
    </a>
  )
}
