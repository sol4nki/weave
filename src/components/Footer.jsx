import './Footer.css'

export default function Footer() {
  return (
    <>
      <div className="footer">
        <div className="compname">Weave &#169; 2025</div>
        <div className="footerlink">
            <a href="https://github.com/sol4nki/weave" target='_blank'>GitHub</a>
            <a href="https://github.com/sol4nki/weave/blob/main/README.md" target='_blank'>Documentation</a>
            {/* <a href="" target='_blank'>Status</a> */}
            <a href="https://github.com/sol4nki/weave/blob/main/Privacy.md" target='_blank'>Privacy</a>
        </div>
      </div>
    </>
  )
}