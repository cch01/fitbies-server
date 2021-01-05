export default function activationEmail(userName: string, url: string): string {
  return `
<!DOCTYPE html>
<html>
  <body>
    <table align="center">
      <tr>
        <td align="center">
          <h2>Email verification for ZOOMED</h2>
        </td>
      </tr>
      <tr>
        <td>
          <h4>Hihi, ${userName}Thank you for using our service.</h4>
        </td> 
      </tr>
      <tr>
        <td>
          <h4>Click <a href="${url}">here</a> to activate your account.</h4>
        </td> 
      </tr>
    </table>  
  </body>
</html>
`;
}
