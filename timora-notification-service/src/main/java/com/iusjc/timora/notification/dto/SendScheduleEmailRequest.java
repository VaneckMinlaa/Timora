package com.iusjc.timora.notification.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SendScheduleEmailRequest {
    private String to;
    private String firstName;
    private String lastName;
    private String scheduleTitle;
    private String attachmentBase64; 
    private String attachmentName;   
}
