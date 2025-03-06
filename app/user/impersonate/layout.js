import CommonLayout from '../../CommonLayout'

export default function Layout({ children }) {
  return (
    <CommonLayout>
      <div className="col-sm-12 col-md-8 col-lg-6 col-md-offset-2 col-lg-offset-3">
        <h1>Impersonate User</h1>

        <p className="text-muted mb-4">
          Enter the user&apos;s email address or username below.
        </p>
        {children}
      </div>
    </CommonLayout>
  )
}
