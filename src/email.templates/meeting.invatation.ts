export default function meetingInvitationEmail(
  initiatorName: string,
  url: string,
  passCode?: string,
): string {
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
          <h4>Hihi, ${initiatorName} is inviting you to join a meeting.</h4>
        </td> 
      </tr>
      <tr>
        <td>
          <h4>Click <a href="${url}">here</a> to activate your account.</h4>
        </td> 
      </tr>
      ${
        passCode ??
        `<tr>
        <td>
          <h4>Here is the pass code for joining the meeting.</h4>
        </td> 
      </tr>
      <tr>
        <td>
          <h2>${passCode}</h2>
        </td> 
      </tr>`
      }
    </table>  
  </body>
</html>
`;
}
