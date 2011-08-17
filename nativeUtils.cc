#include <v8.h>
#include <stdlib.h>
#include <unistd.h>
#include <sys/types.h>
#include <pwd.h>
using namespace v8;
// Resolves a numerical user-id into the user's login name. `man getpwuid_r(3)` says this works with LDAP.
Handle<Value> usernameById(const Arguments &args){
  if(args.Length() < 1){
    return Boolean::New(false);
  }
  // Cast args[0] to an integer (cum uid_t)
  uid_t id = (uid_t) args[0]->Int32Value();
  struct passwd *pws;// the gc catches this structure - trying to free it segfaults.
  if((pws = getpwuid(id)) != NULL){
    return String::New(pws->pw_name);
  }else{
    return Boolean::New(false);
  }
}
/* A wrapper around setsid, to aid in daemonizing. 
"setsid() creates a new session if the calling process is not a process group leader. 
The calling process is the leader of the new session, the process group leader of the new process group, and has no controlling tty..."
- man setsid(2)
*/
Handle<Value> _setsid(const Arguments &_){
  return Integer::New((int) setsid());
}

Handle<Value> _fork(const Arguments &_){
  return Integer::New((int) fork());
}

// Define the library - rather simple, in this case.
extern "C" void init(Handle<Object> target) {
  HandleScope scope;
  target->Set(String::New("usernameById"), FunctionTemplate::New(usernameById)->GetFunction());
  target->Set(String::New("setsid"), FunctionTemplate::New(_setsid)->GetFunction());
  target->Set(String::New("fork"), FunctionTemplate::New(_fork)->GetFunction());
}
