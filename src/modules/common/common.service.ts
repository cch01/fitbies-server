import { Injectable } from "@nestjs/common";

@Injectable()
export class CommonService {
  async healthCheck(): Promise<boolean> {
    return true;
  }
}